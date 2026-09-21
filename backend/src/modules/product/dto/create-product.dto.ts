import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductVariantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  priceAdjustment?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  stockQuantity?: number;
}

export class CreateProductImageDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  mediaId: number;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameVi: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionVi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0, { message: 'Price must be non-negative' })
  @IsNotEmpty()
  originalPrice: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0, { message: 'Sale price must be non-negative' })
  @IsOptional()
  salePrice?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  discountPercentage?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  stockQuantity?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isOutOfStock?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'out_of_stock'], default: 'active' })
  @IsEnum(['active', 'inactive', 'out_of_stock'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'out_of_stock';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @ApiPropertyOptional({ type: [CreateProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @IsOptional()
  variants?: CreateProductVariantDto[];

  @ApiPropertyOptional({ type: [CreateProductImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  @IsOptional()
  images?: CreateProductImageDto[];
}
