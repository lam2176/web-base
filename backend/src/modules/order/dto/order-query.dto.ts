import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@shared/dto/pagination.dto';
import { OrderStatus } from './update-order-status.dto';

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: OrderStatus
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Search by customer name, email, phone, or order number' })
  @IsOptional()
  @IsString()
  search?: string;
}
