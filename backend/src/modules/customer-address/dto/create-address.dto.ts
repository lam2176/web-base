import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home', required: false })
  @IsString()
  @IsOptional()
  addressName?: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '123 Nguyen Hue Street' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Ward 1', required: false })
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiProperty({ example: 'District 1', required: false })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ example: 'Ho Chi Minh City', required: false })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
