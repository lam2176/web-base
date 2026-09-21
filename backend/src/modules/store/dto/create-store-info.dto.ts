import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, IsEmail, IsObject, IsNumber } from 'class-validator';

export class CreateStoreInfoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameVi: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  logoId?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  bankQrId?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hotline?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionVi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiPropertyOptional({ default: 'VND' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @ApiPropertyOptional({ description: 'Bank name (e.g., Vietcombank, BIDV)' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Bank account number' })
  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ description: 'Bank account holder name' })
  @IsString()
  @IsOptional()
  bankAccountName?: string;

  @ApiPropertyOptional({
    type: 'object',
    properties: {
      facebook: { type: 'string' },
      instagram: { type: 'string' },
      tiktok: { type: 'string' },
      youtube: { type: 'string' },
    },
  })
  @IsObject()
  @IsOptional()
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };

  @ApiPropertyOptional({ description: 'Google Maps embed URL (Vietnamese)' })
  @IsString()
  @IsOptional()
  mapUrl?: string;

  @ApiPropertyOptional({ description: 'Google Maps embed URL (English)' })
  @IsString()
  @IsOptional()
  mapUrlEn?: string;
}
