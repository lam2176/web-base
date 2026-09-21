import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateDiscountCodeDto {
  @ApiProperty({ description: 'Discount code', example: 'WELCOME10' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Discount code name', example: 'Welcome discount' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Discount type (currently only percentage is supported)',
    enum: ['percentage'],
    example: 'percentage',
  })
  @IsEnum(['percentage'])
  @IsOptional()
  discountType?: 'percentage';

  @ApiProperty({ description: 'Discount value (percentage: 0-100)', example: 10.0 })
  @IsNumber()
  @Min(0, { message: 'Discount value must be non-negative' })
  @IsNotEmpty()
  discountValue: number;

  @ApiProperty({ description: 'Maximum usage count', example: 100 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  maxUsage: number;

  @ApiProperty({ description: 'Expiry date', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;

  @ApiPropertyOptional({
    description: 'Discount code status',
    enum: ['active', 'inactive'],
    default: 'active',
    example: 'active',
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'Allow users to reuse this discount code multiple times',
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  allowMultiple?: boolean;
}
