import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';

export class CreateMenuDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameVi: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({ enum: ['header', 'footer', 'both'] })
  @IsEnum(['header', 'footer', 'both'])
  @IsNotEmpty()
  location: 'header' | 'footer' | 'both';

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

