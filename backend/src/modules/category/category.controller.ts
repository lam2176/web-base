import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { Public } from '@shared/decorators/public.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';

@ApiTags('Categories')
@Controller('categories')
@Public()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Return all categories' })
  async findAll(@Query('search') search?: string): Promise<ApiResponseDto<any[]>> {
    const result = await this.categoryService.findAll(search);
    return ApiResponseDto.success(result);
  }

  @Get('root')
  @ApiOperation({ summary: 'Get root categories (no parent)' })
  @ApiResponse({ status: 200, description: 'Return root categories' })
  async findRootCategories(): Promise<ApiResponseDto<any[]>> {
    const result = await this.categoryService.findRootCategories();
    return ApiResponseDto.success(result);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiResponse({ status: 200, description: 'Return category' })
  async findBySlug(@Param('slug') slug: string): Promise<ApiResponseDto<any>> {
    const result = await this.categoryService.findBySlug(slug);
    return ApiResponseDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by id' })
  @ApiResponse({ status: 200, description: 'Return category' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.categoryService.findById(id);
    return ApiResponseDto.success(result);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get child categories' })
  @ApiResponse({ status: 200, description: 'Return child categories' })
  async findChildren(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any[]>> {
    const result = await this.categoryService.findChildren(id);
    return ApiResponseDto.success(result);
  }
}
