import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Request,
  Delete,
  Query,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { OrderService } from '../order/order.service';
import { CustomerJwtAuthGuard } from '../customer-auth/guards/customer-jwt-auth.guard';

@ApiTags('👤 Customer Profile')
@Controller('customer/profile')
@UseGuards(CustomerJwtAuthGuard)
@ApiBearerAuth('customer-jwt')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly orderService: OrderService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get customer profile',
    description: 'Get the profile information of the authenticated customer'
  })
  @ApiResponse({ status: 200, description: 'Returns customer profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.customerService.getProfile(req.user.id);
  }

  @Patch()
  @ApiOperation({
    summary: 'Update customer profile',
    description: 'Update profile information such as full name, phone number, date of birth, and gender'
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Request() req) {
    return this.customerService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('change-password')
  @ApiOperation({
    summary: 'Change customer password',
    description: 'Change the password for the authenticated customer account. Requires current password verification.'
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Request() req) {
    return this.customerService.changePassword(req.user.id, changePasswordDto);
  }

  @Delete('deactivate')
  @ApiOperation({
    summary: 'Deactivate customer account',
    description: 'Deactivate the customer account. The account can be reactivated by contacting support.'
  })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deactivateAccount(@Request() req) {
    return this.customerService.deactivateAccount(req.user.id);
  }

  @Get('orders')
  @ApiOperation({
    summary: 'Get customer orders',
    description: 'Get paginated list of orders placed by the authenticated customer'
  })
  @ApiResponse({ status: 200, description: 'Returns customer orders with pagination' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOrders(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.orderService.findCustomerOrders(req.user.id, page, limit);
  }

  @Get('orders/:id')
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Get detailed information about a specific order by ID. Only returns orders belonging to the authenticated customer.'
  })
  @ApiResponse({ status: 200, description: 'Returns order details' })
  @ApiResponse({ status: 404, description: 'Order not found or does not belong to customer' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOrderById(
    @Request() req,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.orderService.findCustomerOrderById(req.user.id, orderId);
  }
}
