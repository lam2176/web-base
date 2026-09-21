import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsInt, IsBoolean } from 'class-validator';

export class CreatePageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleVi: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contentVi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contentEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keywords?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  featuredImageId?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  featuredVideoId?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  featuredImageAlt?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  showInMenu?: boolean;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], default: 'active' })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';
}
