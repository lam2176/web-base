import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerAddressService } from './customer-address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CustomerJwtAuthGuard } from '../customer-auth/guards/customer-jwt-auth.guard';

@ApiTags('📍 Customer Addresses')
@Controller('customer/addresses')
@UseGuards(CustomerJwtAuthGuard)
@ApiBearerAuth('customer-jwt')
export class CustomerAddressController {
  constructor(private readonly customerAddressService: CustomerAddressService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all addresses for logged-in customer',
    description: 'Retrieve all delivery addresses saved by the authenticated customer'
  })
  @ApiResponse({ status: 200, description: 'Returns list of customer addresses' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Request() req) {
    return this.customerAddressService.findAll(req.user.id);
  }

  @Get('default')
  @ApiOperation({
    summary: 'Get default address for logged-in customer',
    description: 'Get the default delivery address marked by the customer'
  })
  @ApiResponse({ status: 200, description: 'Returns default address' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No default address found' })
  async getDefault(@Request() req) {
    return this.customerAddressService.getDefault(req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific address by ID',
    description: 'Get details of a specific delivery address belonging to the customer'
  })
  @ApiResponse({ status: 200, description: 'Returns address details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.customerAddressService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new address',
    description: 'Add a new delivery address for the authenticated customer'
  })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createAddressDto: CreateAddressDto, @Request() req) {
    return this.customerAddressService.create(req.user.id, createAddressDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an address',
    description: 'Update details of an existing delivery address'
  })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAddressDto: UpdateAddressDto,
    @Request() req,
  ) {
    return this.customerAddressService.update(id, req.user.id, updateAddressDto);
  }

  @Patch(':id/set-default')
  @ApiOperation({
    summary: 'Set an address as default',
    description: 'Mark a specific address as the default delivery address for future orders'
  })
  @ApiResponse({ status: 200, description: 'Address set as default successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async setDefault(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.customerAddressService.setDefault(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an address',
    description: 'Remove a delivery address from the customer\'s saved addresses'
  })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.customerAddressService.remove(id, req.user.id);
  }
}
