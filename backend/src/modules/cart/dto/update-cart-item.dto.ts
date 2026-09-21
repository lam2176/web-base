import { IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity', example: 2, minimum: 1 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;
}
