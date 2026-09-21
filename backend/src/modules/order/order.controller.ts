import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Public } from '@shared/decorators/public.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { OptionalCustomerJwtAuthGuard } from '../customer-auth/guards/optional-customer-jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@Public()
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(OptionalCustomerJwtAuthGuard)
  @ApiOperation({
    summary: 'Create a new order',
    description: 'Public endpoint - works for both guest and logged-in customers. If customer is logged in (with valid JWT token), customerId will be automatically extracted and linked to the order.'
  })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiBearerAuth()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Extract customerId from JWT if user is authenticated
      const user = (req as any).user;
      const customerId = user?.type === 'customer' ? user.id : undefined;

      this.logger.log(`Creating order - User: ${JSON.stringify(user)}, CustomerId: ${customerId}`);

      const result = await this.orderService.create({
        ...createOrderDto,
        ...(customerId && { customerId }), // Only include if defined
      });

      this.logger.log(`Order created successfully: ${result.orderNumber}, CustomerId in DB: ${result.customerId}`);

      return ApiResponseDto.success(result, 'Order created successfully');
    } catch (error) {
      this.logger.error(`Order creation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number (public endpoint)' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string): Promise<ApiResponseDto<any>> {
    const result = await this.orderService.findByOrderNumber(orderNumber);
    return ApiResponseDto.success(result, 'Order retrieved successfully');
  }
}
