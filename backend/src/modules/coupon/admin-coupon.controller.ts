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
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

@ApiTags('Admin - Coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/coupons')
@Roles('admin')
@ApiBearerAuth()
export class AdminCouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @ApiOperation({ summary: '[Admin] Create a new coupon' })
  @ApiResponse({ status: 201, description: 'Coupon created successfully' })
  async create(@Body() createCouponDto: CreateCouponDto): Promise<ApiResponseDto<any>> {
    const result = await this.couponService.create(createCouponDto);
    return ApiResponseDto.success(result, 'Coupon created successfully');
  }

  @Get()
  @ApiOperation({ summary: '[Admin] Get all coupons' })
  @ApiResponse({ status: 200, description: 'Return all coupons' })
  async findAll(): Promise<ApiResponseDto<any[]>> {
    const result = await this.couponService.findAll();
    return ApiResponseDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get coupon by id' })
  @ApiResponse({ status: 200, description: 'Return coupon' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.couponService.findById(id);
    return ApiResponseDto.success(result);
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Update coupon' })
  @ApiResponse({ status: 200, description: 'Coupon updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.couponService.update(id, updateCouponDto);
    return ApiResponseDto.success(result, 'Coupon updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Delete coupon' })
  @ApiResponse({ status: 200, description: 'Coupon deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.couponService.delete(id);
    return ApiResponseDto.success(null, 'Coupon deleted successfully');
  }
}
