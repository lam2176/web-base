import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DiscountCodeService } from './discount-code.service';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

@ApiTags('Admin - Discount Codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/discount-codes')
@Roles('admin')
@ApiBearerAuth()
export class AdminDiscountCodeController {
  constructor(private readonly discountCodeService: DiscountCodeService) {}

  @Post()
  @ApiOperation({ summary: '[Admin] Create a new discount code' })
  @ApiResponse({ status: 201, description: 'Discount code created successfully' })
  async create(@Body() createDiscountCodeDto: CreateDiscountCodeDto): Promise<ApiResponseDto<any>> {
    const result = await this.discountCodeService.create(createDiscountCodeDto);
    return ApiResponseDto.success(result, 'Discount code created successfully');
  }

  @Get()
  @ApiOperation({ summary: '[Admin] Get all discount codes' })
  @ApiResponse({ status: 200, description: 'Return all discount codes' })
  async findAll(): Promise<ApiResponseDto<any[]>> {
    const result = await this.discountCodeService.findAll();
    return ApiResponseDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get discount code by id' })
  @ApiResponse({ status: 200, description: 'Return discount code' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.discountCodeService.findById(id);
    return ApiResponseDto.success(result);
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Update discount code' })
  @ApiResponse({ status: 200, description: 'Discount code updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDiscountCodeDto: UpdateDiscountCodeDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.discountCodeService.update(id, updateDiscountCodeDto);
    return ApiResponseDto.success(result, 'Discount code updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Delete discount code' })
  @ApiResponse({ status: 200, description: 'Discount code deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.discountCodeService.delete(id);
    return ApiResponseDto.success(null, 'Discount code deleted successfully');
  }
}
