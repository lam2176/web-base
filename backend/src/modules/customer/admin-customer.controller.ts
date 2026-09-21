import {
  Controller,
  Get,
  UseGuards,
  Param,
  ParseIntPipe,
  Body,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';

@ApiTags('Admin - Customers')
@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
@ApiBearerAuth()
export class AdminCustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Get customers with statistics' })
  @ApiResponse({ status: 200, description: 'Return customers with stats' })
  async findAll() {
    const customers = await this.customerService.getAdminCustomerStats();
    return ApiResponseDto.success(customers);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get customer detail' })
  @ApiResponse({ status: 200, description: 'Return customer detail' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const customer = await this.customerService.getAdminCustomerById(id);
    return ApiResponseDto.success(customer);
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Update customer information' })
  @ApiResponse({ status: 200, description: 'Return updated customer' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { fullName?: string; phoneNumber?: string; email?: string; isActive?: boolean },
  ) {
    const updated = await this.customerService.adminUpdateCustomer(id, body);
    return ApiResponseDto.success(updated, 'Customer updated successfully');
  }
}
