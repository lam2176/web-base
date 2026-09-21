import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';

export class AdminRegisterDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Admin email address'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Admin password (minimum 6 characters)'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'admin',
    enum: ['admin', 'staff'],
    description: 'User role (admin or staff)'
  })
  @IsEnum(['admin', 'staff'])
  role: 'admin' | 'staff';
}
