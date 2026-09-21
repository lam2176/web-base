import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { AdminProductQueryDto } from './dto/admin-product-query.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiResponseDto, PaginatedResponseDto } from '@shared/dto/api-response.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

@ApiTags('Admin - Products')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Get all products with filters' })
  @ApiResponse({ status: 200, description: 'Return all products' })
  async findAll(@Query() query: AdminProductQueryDto): Promise<PaginatedResponseDto<any[]>> {
    const { data, pagination } = await this.productService.findAll(query);
    return new PaginatedResponseDto(data, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get product by id' })
  @ApiResponse({ status: 200, description: 'Return product' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    // Return raw database fields for admin edit form
    const result = await this.productService.findById(id);
    return ApiResponseDto.success(result);
  }

  @Post()
  @ApiOperation({ summary: '[Admin] Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async create(@Body() createProductDto: CreateProductDto): Promise<ApiResponseDto<any>> {
    const result = await this.productService.create(createProductDto);
    return ApiResponseDto.success(result, 'Product created successfully');
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.productService.update(id, updateProductDto);
    return ApiResponseDto.success(result, 'Product updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.productService.delete(id);
    return ApiResponseDto.success(null, 'Product deleted successfully');
  }

  @Post('import')
  @ApiOperation({ summary: '[Admin] Import products from CSV data' })
  @ApiResponse({ status: 200, description: 'Products imported successfully' })
  async importProducts(@Body() importDto: { products: CreateProductDto[] }): Promise<ApiResponseDto<any>> {
    const result = await this.productService.importProducts(importDto.products);
    return ApiResponseDto.success(result, 'Products imported successfully');
  }
}
