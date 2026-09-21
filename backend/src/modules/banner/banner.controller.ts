import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BannerService } from './banner.service';
import { Public } from '@shared/decorators/public.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';

@ApiTags('Banners')
@Controller('banners')
@Public()
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get active banners for public display' })
  @ApiResponse({ status: 200, description: 'Return active banners' })
  async findActive(): Promise<ApiResponseDto<any[]>> {
    const result = await this.bannerService.findActive();
    return ApiResponseDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get banner by id' })
  @ApiResponse({ status: 200, description: 'Return banner' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.bannerService.findById(id);
    return ApiResponseDto.success(result);
  }
}
