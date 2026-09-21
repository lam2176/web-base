import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PageService } from './page.service';
import { Public } from '@shared/decorators/public.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';

@ApiTags('Pages')
@Controller('pages')
@Public()
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get('menu')
  @ApiOperation({ summary: 'Get pages for menu (showInMenu=true)' })
  @ApiResponse({ status: 200, description: 'Return pages for menu' })
  async findMenuPages(): Promise<ApiResponseDto<any>> {
    const result = await this.pageService.findMenuPages();
    return ApiResponseDto.success(result);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get page by slug' })
  @ApiResponse({ status: 200, description: 'Return page' })
  async findBySlug(@Param('slug') slug: string): Promise<ApiResponseDto<any>> {
    const result = await this.pageService.findBySlug(slug);
    return ApiResponseDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get page by id' })
  @ApiResponse({ status: 200, description: 'Return page' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.pageService.findById(id);
    return ApiResponseDto.success(result);
  }
}
