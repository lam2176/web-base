import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsInt,
} from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  menuId: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  parentId?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  labelVi: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  labelEn: string;

  @ApiProperty({
    enum: ['page', 'product', 'category', 'custom', 'cart', 'account', 'login', 'register', 'profile'],
  })
  @IsEnum(['page', 'product', 'category', 'custom', 'cart', 'account', 'login', 'register', 'profile'])
  @IsNotEmpty()
  type: 'page' | 'product' | 'category' | 'custom' | 'cart' | 'account' | 'login' | 'register' | 'profile';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pageSlug?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  openInNewTab?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Icon fields
  @ApiPropertyOptional({ enum: ['lucide', 'svg', 'image'] })
  @IsEnum(['lucide', 'svg', 'image'])
  @IsOptional()
  iconType?: 'lucide' | 'svg' | 'image';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  iconUrl?: string;

  // Visibility rules
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  visibleOnDesktop?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  visibleOnMobile?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  requiresAuth?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  adminOnly?: boolean;

  // SEO fields
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaTitleVi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaTitleEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaDescriptionVi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaDescriptionEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ogImageUrl?: string;
}

