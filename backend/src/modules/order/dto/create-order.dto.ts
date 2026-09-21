import { IsString, IsEmail, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiPropertyOptional({ description: 'Variant ID if product has variants' })
  @IsOptional()
  @IsInt()
  variantId?: number;

  @ApiProperty({ description: 'Product name (will be fetched from DB)' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ description: 'Variant name (e.g., "Color: Red, Size: XL")' })
  @IsOptional()
  @IsString()
  variantName?: string;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Price per unit at time of order' })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Customer full name' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Customer email address' })
  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ description: 'Customer phone number' })
  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: 'Customer delivery address' })
  @IsNotEmpty()
  @IsString()
  customerAddress: string;

  @ApiProperty({ description: 'Order items', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ description: 'Discount code ID if applied' })
  @IsOptional()
  @IsInt()
  discountCodeId?: number;

  @ApiPropertyOptional({ description: 'Coupon code if promotion is applied automatically' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Additional notes for the order' })
  @IsOptional()
  @IsString()
  notes?: string;
}
