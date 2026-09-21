import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ description: 'Coupon code', example: 'SUMMER2024' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Coupon name in Vietnamese', example: 'Giảm giá mùa hè' })
  @IsString()
  @IsNotEmpty()
  nameVi: string;

  @ApiProperty({ description: 'Coupon name in English', example: 'Summer Discount' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({
    description: 'Discount type',
    enum: ['percentage', 'fixed'],
    example: 'percentage',
  })
  @IsEnum(['percentage', 'fixed'])
  @IsNotEmpty()
  discountType: 'percentage' | 'fixed';

  @ApiProperty({ description: 'Discount value (percentage: 0-100, fixed: > 0)', example: 10.5 })
  @IsNumber()
  @Min(0, { message: 'Discount value must be non-negative' })
  @IsNotEmpty()
  discountValue: number;

  @ApiProperty({ description: 'Start date', example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End date', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Apply coupon to',
    enum: ['all', 'category'],
    default: 'all',
    example: 'all',
  })
  @IsEnum(['all', 'category'])
  @IsOptional()
  applyTo?: 'all' | 'category';

  @ApiPropertyOptional({
    description: 'Array of category IDs (required if applyTo is "category")',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  categoryIds?: number[];

  @ApiPropertyOptional({
    description: 'Coupon status',
    enum: ['active', 'inactive'],
    default: 'active',
    example: 'active',
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'Allow using this coupon with other coupons',
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  allowMultiple?: boolean;
}
