import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({ example: 'Mình cần điện thoại chụp ảnh đẹp tầm 10 triệu' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({
    type: [ChatMessageDto],
    description: 'Recent conversation, oldest first; the last message must be from the user',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
