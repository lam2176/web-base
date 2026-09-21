import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

@ApiTags('Admin - Banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/banners')
@Roles('admin')
@ApiBearerAuth()
export class AdminBannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @ApiOperation({ summary: '[Admin] Create a new banner' })
  @ApiResponse({ status: 201, description: 'Banner created successfully' })
  async create(@Body() createBannerDto: CreateBannerDto): Promise<ApiResponseDto<any>> {
    const result = await this.bannerService.create(createBannerDto);
    return ApiResponseDto.success(result, 'Banner created successfully');
  }

  @Get()
  @ApiOperation({ summary: '[Admin] Get all banners' })
  @ApiResponse({ status: 200, description: 'Return all banners' })
  async findAll(): Promise<ApiResponseDto<any[]>> {
    const result = await this.bannerService.findAll();
    return ApiResponseDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get banner by id' })
  @ApiResponse({ status: 200, description: 'Return banner' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.bannerService.findById(id);
    return ApiResponseDto.success(result);
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Update banner' })
  @ApiResponse({ status: 200, description: 'Banner updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBannerDto: UpdateBannerDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.bannerService.update(id, updateBannerDto);
    return ApiResponseDto.success(result, 'Banner updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Delete banner' })
  @ApiResponse({ status: 200, description: 'Banner deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.bannerService.delete(id);
    return ApiResponseDto.success(null, 'Banner deleted successfully');
  }
}
