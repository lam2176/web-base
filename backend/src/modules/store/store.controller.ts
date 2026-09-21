import {
  Controller,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { Public } from '@shared/decorators/public.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';

@ApiTags('Store')
@Controller('store')
@Public()
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  @ApiOperation({ summary: 'Get store information' })
  @ApiResponse({ status: 200, description: 'Return store information' })
  async get(): Promise<ApiResponseDto<any>> {
    const result = await this.storeService.get();
    return ApiResponseDto.success(result);
  }
}
