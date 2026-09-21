import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class ValidateDiscountCodeDto {
  @ApiProperty({ description: 'Discount code to validate', example: 'WELCOME10' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Customer email for per-user usage check', example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Customer phone for per-user usage check', example: '0901234567' })
  @IsOptional()
  @IsString()
  customerPhone?: string;
}
