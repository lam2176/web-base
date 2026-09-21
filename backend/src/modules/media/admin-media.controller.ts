import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

@ApiTags('Admin - Media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/media')
@Roles('admin')
@ApiBearerAuth()
export class AdminMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[Admin] Upload a file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<ApiResponseDto<any>> {
    const result = await this.mediaService.uploadFile(file);
    return ApiResponseDto.success(result, 'File uploaded successfully');
  }

  @Get()
  @ApiOperation({ summary: '[Admin] Get all media' })
  @ApiResponse({ status: 200, description: 'Return all media' })
  async findAll(): Promise<ApiResponseDto<any[]>> {
    const result = await this.mediaService.findAll();
    return ApiResponseDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get media by id' })
  @ApiResponse({ status: 200, description: 'Return media' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const result = await this.mediaService.findById(id);
    return ApiResponseDto.success(result);
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Update media (rename)' })
  @ApiResponse({ status: 200, description: 'Media updated successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMediaDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.mediaService.update(id, updateDto);
    return ApiResponseDto.success(result, 'Media updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Delete media' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.mediaService.delete(id);
    return ApiResponseDto.success(null, 'Media deleted successfully');
  }
}
