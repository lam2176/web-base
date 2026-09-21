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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

@ApiTags('Admin - Categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/categories')
@Roles('admin')
@ApiBearerAuth()
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Get all categories' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Return all categories' })
  async findAll(@Query('search') search?: string): Promise<ApiResponseDto<any[]>> {
    const result = await this.categoryService.findAll(search);
    return ApiResponseDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get category by id' })
  @ApiResponse({ status: 200, description: 'Return category' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.categoryService.findById(id);
    return ApiResponseDto.success(result);
  }

  @Post()
  @ApiOperation({ summary: '[Admin] Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<ApiResponseDto<any>> {
    const result = await this.categoryService.create(createCategoryDto);
    return ApiResponseDto.success(result, 'Category created successfully');
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.categoryService.update(id, updateCategoryDto);
    return ApiResponseDto.success(result, 'Category updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.categoryService.delete(id);
    return ApiResponseDto.success(null, 'Category deleted successfully');
  }
}
