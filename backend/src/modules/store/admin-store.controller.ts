import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { UpdateStoreInfoDto } from './dto/update-store-info.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

@ApiTags('Admin - Store')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/store')
@Roles('admin')
@ApiBearerAuth()
export class AdminStoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Get store information' })
  @ApiResponse({ status: 200, description: 'Return store information' })
  async get(): Promise<ApiResponseDto<any>> {
    const result = await this.storeService.get();
    return ApiResponseDto.success(result);
  }

  @Put()
  @ApiOperation({ summary: '[Admin] Update store information' })
  @ApiResponse({ status: 200, description: 'Store information updated successfully' })
  async update(@Body() updateStoreInfoDto: UpdateStoreInfoDto): Promise<ApiResponseDto<any>> {
    const result = await this.storeService.update(updateStoreInfoDto);
    return ApiResponseDto.success(result, 'Store information updated successfully');
  }
}
