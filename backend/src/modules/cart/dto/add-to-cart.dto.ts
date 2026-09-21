import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ description: 'Product ID', example: 1 })
  @IsNumber()
  productId: number;

  @ApiPropertyOptional({ description: 'Variant ID if product has variants', example: 1 })
  @IsOptional()
  @IsNumber()
  variantId?: number;

  @ApiProperty({ description: 'Quantity to add', example: 1, minimum: 1 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;
}
