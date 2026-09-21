import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CustomerLoginDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer email address'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Customer password'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
