import { BadRequestException, Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@ApiTags('Chatbot')
@UseGuards(ThrottlerGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 messages per minute per IP
  @ApiOperation({ summary: 'Ask the shopping assistant (product search & advice)' })
  @ApiResponse({ status: 200, description: 'Assistant reply with recommended products' })
  async chat(@Body() { messages }: ChatRequestDto): Promise<ApiResponseDto<any>> {
    if (messages[messages.length - 1].role !== 'user') {
      throw new BadRequestException('The last message must be from the user');
    }

    const result = await this.chatService.chat(messages);
    return ApiResponseDto.success(result);
  }
}
