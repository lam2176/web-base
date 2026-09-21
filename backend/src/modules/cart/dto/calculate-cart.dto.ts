import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Variant name if applicable' })
  @IsOptional()
  @IsString()
  variantName?: string;
}

export class CalculateCartDto {
  @ApiProperty({ description: 'Cart items', type: [CartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiPropertyOptional({ description: 'Discount code to apply' })
  @IsOptional()
  @IsString()
  discountCode?: string;
}
