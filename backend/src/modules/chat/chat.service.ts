import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiError,
  Content,
  FinishReason,
  FunctionCallingConfigMode,
  GoogleGenAI,
  Part,
} from '@google/genai';
import { CHAT_SYSTEM_PROMPT, PRODUCT_MARKER } from './chat.prompt';
import { CHAT_TOOL_DECLARATIONS, ChatProductCard, ChatToolsService } from './chat.tools';
import { ChatMessageDto } from './dto/chat-request.dto';

// Free-tier models, tried in order. Free-tier quotas are per model (a few requests/minute),
// so falling back to the next model on 429/overload multiplies capacity.
// Override with GEMINI_MODEL as a comma-separated list.
const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite'];
// Model calls per question; the last one is forced to answer without tools
const MAX_ROUNDS = 4;
const REQUEST_TIMEOUT_MS = 15000;
// Stop trying further models before the 60s serverless limit
const OVERALL_DEADLINE_MS = 45000;
const FORCE_ANSWER_NOTE =
  '(Hệ thống: đã hết lượt tra cứu. Không gọi thêm công cụ. Hãy trả lời khách ngay bằng thông tin đã có ở trên.)';

export interface ChatReply {
  reply: string;
  products: ChatProductCard[];
}

// A model call failed in a way another model may not (quota, overload, timeout, retired model)
class ModelCallError extends Error {
  constructor(
    readonly model: string,
    readonly status: number | undefined,
    message: string,
  ) {
    super(message);
  }
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ai: GoogleGenAI | null;
  private readonly models: string[];

  constructor(
    configService: ConfigService,
    private readonly chatTools: ChatToolsService,
  ) {
    const apiKey = configService.get<string>('GEMINI_API_KEY');
    this.ai = apiKey
      ? new GoogleGenAI({ apiKey, httpOptions: { timeout: REQUEST_TIMEOUT_MS } })
      : null;

    const configured = (configService.get<string>('GEMINI_MODEL') || '')
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean);
    this.models = configured.length > 0 ? configured : DEFAULT_MODELS;
  }

  async chat(messages: ChatMessageDto[]): Promise<ChatReply> {
    if (!this.ai) {
      throw new ServiceUnavailableException('Chatbot chưa được cấu hình (thiếu GEMINI_API_KEY)');
    }

    const startedAt = Date.now();
    let quotaExceeded = false;

    for (const model of this.models) {
      if (Date.now() - startedAt > OVERALL_DEADLINE_MS) break;
      try {
        return await this.converse(model, messages);
      } catch (error) {
        if (!(error instanceof ModelCallError)) throw error;
        this.logger.warn(`Model ${model} failed (${error.status ?? 'no status'}): ${error.message}`);
        if (error.status === 429) quotaExceeded = true;
      }
    }

    if (quotaExceeded) {
      throw new HttpException(
        'Chatbot đang quá tải, bạn vui lòng thử lại sau khoảng 1 phút',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    throw new ServiceUnavailableException('Chatbot tạm thời không phản hồi, bạn thử lại sau nhé');
  }

  // Runs the whole tool loop on one model. Restarting from scratch on fallback avoids
  // replaying one model's thought signatures to another.
  private async converse(model: string, messages: ChatMessageDto[]): Promise<ChatReply> {
    const contents: Content[] = messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));
    const seenProducts = new Map<string, ChatProductCard>();

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const isLastRound = round === MAX_ROUNDS - 1;
      const response = await this.generate(model, contents, isLastRound);
      const candidate = response.candidates?.[0];

      if (candidate?.finishReason === FinishReason.SAFETY) {
        return { reply: 'Xin lỗi, mình không thể trả lời câu hỏi này. Bạn cần tìm sản phẩm gì không?', products: [] };
      }

      const functionCalls = response.functionCalls ?? [];
      // On the last round, any text wins even if the model still asked for a tool
      if (functionCalls.length === 0 || (isLastRound && response.text)) {
        return this.buildReply(response.text ?? '', seenProducts);
      }

      // Echo the model turn back unchanged: it carries the thought signatures Gemini requires
      contents.push(candidate.content);

      const responseParts: Part[] = await Promise.all(
        functionCalls.map(async (call) => {
          const { result, products } = await this.chatTools.execute(call.name, call.args ?? {});
          products.forEach((product) => seenProducts.set(product.slug, product));
          return {
            functionResponse: { id: call.id, name: call.name, response: { result } },
          };
        }),
      );
      contents.push({ role: 'user', parts: responseParts });
    }

    // Unreachable in practice: the last round runs with function calling disabled
    return {
      reply: 'Xin lỗi, mình chưa tìm được câu trả lời phù hợp. Bạn có thể nói rõ hơn nhu cầu của mình không?',
      products: [],
    };
  }

  private async generate(model: string, contents: Content[], forceAnswer: boolean) {
    // Out of rounds: answer from what the tools already returned. Some models ignore
    // mode NONE, so also tell them explicitly in the last (function response) turn.
    const request = forceAnswer
      ? [
          ...contents.slice(0, -1),
          {
            ...contents[contents.length - 1],
            parts: [...contents[contents.length - 1].parts, { text: FORCE_ANSWER_NOTE }],
          },
        ]
      : contents;

    try {
      return await this.ai.models.generateContent({
        model,
        contents: request,
        config: {
          systemInstruction: CHAT_SYSTEM_PROMPT,
          tools: [{ functionDeclarations: CHAT_TOOL_DECLARATIONS }],
          toolConfig: forceAnswer
            ? { functionCallingConfig: { mode: FunctionCallingConfigMode.NONE } }
            : undefined,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ModelCallError(model, error.status, error.message.slice(0, 300));
      }
      // Timeouts/network errors surface as plain errors from fetch
      throw new ModelCallError(model, undefined, String((error as Error)?.message ?? error));
    }
  }

  // Strip product markers and keep only products the tools actually returned (no hallucinated cards)
  private buildReply(text: string, seenProducts: Map<string, ChatProductCard>): ChatReply {
    const products: ChatProductCard[] = [];
    for (const [, slug] of text.matchAll(PRODUCT_MARKER)) {
      const product = seenProducts.get(slug.toLowerCase());
      if (product && !products.includes(product)) products.push(product);
    }

    const reply = text
      .replace(PRODUCT_MARKER, '')
      .replace(/[ \t]+([,.!?])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    return { reply, products };
  }
}
