import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiResponseDto, PaginatedResponseDto } from '@shared/dto/api-response.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

@ApiTags('Admin - Orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/orders')
@Roles('admin', 'staff')
@ApiBearerAuth()
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Get all orders' })
  @ApiResponse({ status: 200, description: 'Return all orders' })
  async findAll(@Query() query: OrderQueryDto): Promise<PaginatedResponseDto<any[]>> {
    const { data, pagination } = await this.orderService.findAll(query);
    return new PaginatedResponseDto(data, pagination, 'Orders retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get order by ID' })
  @ApiResponse({ status: 200, description: 'Return order details' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.orderService.findById(id);
    return ApiResponseDto.success(result, 'Order retrieved successfully');
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Update order details' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.orderService.update(id, updateOrderDto);
    return ApiResponseDto.success(result, 'Order updated successfully');
  }

  @Put(':id/status')
  @ApiOperation({ summary: '[Admin] Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req,
  ): Promise<ApiResponseDto<any>> {
    const user = req.user;
    const result = await this.orderService.updateStatus(
      id,
      updateOrderStatusDto,
      user.email,
      user.id,
      updateOrderStatusDto.note
    );
    return ApiResponseDto.success(result, 'Order status updated successfully');
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Delete order (admin only)' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.orderService.delete(id);
    return ApiResponseDto.success(result, 'Order deleted successfully');
  }
}
