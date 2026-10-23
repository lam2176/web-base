import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { Public } from '@shared/decorators/public.decorator';
import { ApiResponseDto, PaginatedResponseDto } from '@shared/dto/api-response.dto';

@ApiTags('Products')
@Controller('products')
@Public()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiResponse({ status: 200, description: 'Return all products' })
  async findAll(@Query() query: ProductQueryDto): Promise<PaginatedResponseDto<any[]>> {
    const { data, pagination } = await this.productService.findAll(query, { activeOnly: true });
    return new PaginatedResponseDto(data, pagination);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiResponse({ status: 200, description: 'Return featured products' })
  async findFeatured(
    @Query('limit') limit?: number,
  ): Promise<ApiResponseDto<any[]>> {
    const parsedLimit = limit ? Number(limit) : undefined;
    const result = await this.productService.findFeatured(parsedLimit);
    return ApiResponseDto.success(result);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({ status: 200, description: 'Return product' })
  async findBySlug(@Param('slug') slug: string): Promise<ApiResponseDto<any>> {
    const result = await this.productService.findBySlug(slug);
    return ApiResponseDto.success(this.ensurePublished(result));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiResponse({ status: 200, description: 'Return product' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.productService.findById(id);
    return ApiResponseDto.success(this.ensurePublished(result));
  }

  // Hidden (inactive) products are only visible through the admin API
  private ensurePublished<T extends { status?: string }>(product: T): T {
    if (product.status === 'inactive') {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products' })
  @ApiResponse({ status: 200, description: 'Return related products' })
  async findRelated(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: number,
  ): Promise<ApiResponseDto<any[]>> {
    const parsedLimit = limit ? Number(limit) : undefined;
    const result = await this.productService.findRelated(id, parsedLimit);
    return ApiResponseDto.success(result);
  }
}
