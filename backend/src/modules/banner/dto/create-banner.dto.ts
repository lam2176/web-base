import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, IsEnum } from 'class-validator';

export class CreateBannerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  titleVi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  titleEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subtitleVi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subtitleEn?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  imageId?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], default: 'active' })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';
}
