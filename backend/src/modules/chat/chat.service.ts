import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, Content, FinishReason, GoogleGenAI, Part } from '@google/genai';
import { CHAT_SYSTEM_PROMPT, PRODUCT_MARKER } from './chat.prompt';
import { CHAT_TOOL_DECLARATIONS, ChatProductCard, ChatToolsService } from './chat.tools';
import { ChatMessageDto } from './dto/chat-request.dto';

// Free-tier Flash model; override with GEMINI_MODEL
const DEFAULT_MODEL = 'gemini-3.8-flash';
// Each round is one model call; stops runaway tool loops
const MAX_TOOL_ROUNDS = 5;
const REQUEST_TIMEOUT_MS = 20000;

export interface ChatReply {
  reply: string;
  products: ChatProductCard[];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ai: GoogleGenAI | null;
  private readonly model: string;

  constructor(
    configService: ConfigService,
    private readonly chatTools: ChatToolsService,
  ) {
    const apiKey = configService.get<string>('GEMINI_API_KEY');
    this.ai = apiKey
      ? new GoogleGenAI({ apiKey, httpOptions: { timeout: REQUEST_TIMEOUT_MS } })
      : null;
    this.model = configService.get<string>('GEMINI_MODEL') || DEFAULT_MODEL;
  }

  async chat(messages: ChatMessageDto[]): Promise<ChatReply> {
    if (!this.ai) {
      throw new ServiceUnavailableException('Chatbot chưa được cấu hình (thiếu GEMINI_API_KEY)');
    }

    const contents: Content[] = messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));
    const seenProducts = new Map<string, ChatProductCard>();

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.generate(contents);
      const candidate = response.candidates?.[0];

      if (candidate?.finishReason === FinishReason.SAFETY) {
        return { reply: 'Xin lỗi, mình không thể trả lời câu hỏi này. Bạn cần tìm sản phẩm gì không?', products: [] };
      }

      const functionCalls = response.functionCalls ?? [];
      if (functionCalls.length === 0) {
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

    this.logger.warn(`Tool loop exceeded ${MAX_TOOL_ROUNDS} rounds`);
    return {
      reply: 'Xin lỗi, mình chưa tìm được câu trả lời phù hợp. Bạn có thể nói rõ hơn nhu cầu của mình không?',
      products: [],
    };
  }

  private async generate(contents: Content[]) {
    try {
      return await this.ai.models.generateContent({
        model: this.model,
        contents,
        config: {
          systemInstruction: CHAT_SYSTEM_PROMPT,
          tools: [{ functionDeclarations: CHAT_TOOL_DECLARATIONS }],
        },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        this.logger.error(`Gemini API error ${error.status}: ${error.message}`);
        if (error.status === 429) {
          throw new HttpException(
            'Chatbot đang quá tải, bạn vui lòng thử lại sau ít phút',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        throw new ServiceUnavailableException('Chatbot tạm thời không phản hồi, bạn thử lại sau nhé');
      }
      throw error;
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
