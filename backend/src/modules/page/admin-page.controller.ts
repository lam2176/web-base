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
import { PageService } from './page.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { ReorderPagesDto } from './dto/reorder-pages.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

@ApiTags('Admin - Pages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/pages')
@Roles('admin')
@ApiBearerAuth()
export class AdminPageController {
  constructor(private readonly pageService: PageService) {}

  @Post()
  @ApiOperation({ summary: '[Admin] Create a new page' })
  @ApiResponse({ status: 201, description: 'Page created successfully' })
  async create(@Body() createPageDto: CreatePageDto): Promise<ApiResponseDto<any>> {
    const result = await this.pageService.create(createPageDto);
    return ApiResponseDto.success(result, 'Page created successfully');
  }

  @Get()
  @ApiOperation({ summary: '[Admin] Get all pages' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Return all pages' })
  async findAll(@Query('search') search?: string): Promise<ApiResponseDto<any[]>> {
    const result = await this.pageService.findAll(search);
    return ApiResponseDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get page by id' })
  @ApiResponse({ status: 200, description: 'Return page' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.pageService.findById(id);
    return ApiResponseDto.success(result);
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Update page' })
  @ApiResponse({ status: 200, description: 'Page updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePageDto: UpdatePageDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.pageService.update(id, updatePageDto);
    return ApiResponseDto.success(result, 'Page updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Delete page' })
  @ApiResponse({ status: 200, description: 'Page deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.pageService.delete(id);
    return ApiResponseDto.success(null, 'Page deleted successfully');
  }

  @Post('reorder')
  @ApiOperation({ summary: '[Admin] Reorder pages' })
  @ApiResponse({ status: 200, description: 'Pages reordered successfully' })
  async reorder(@Body() reorderPagesDto: ReorderPagesDto): Promise<ApiResponseDto<any>> {
    const result = await this.pageService.reorder(reorderPagesDto.pages);
    return ApiResponseDto.success(result, 'Pages reordered successfully');
  }
}
