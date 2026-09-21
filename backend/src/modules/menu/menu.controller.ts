import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Public } from '@shared/decorators/public.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';

@ApiTags('Menus')
@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get(':location')
  @Public()
  @ApiOperation({ summary: 'Get menus by location (header/footer)' })
  @ApiResponse({ status: 200, description: 'Return menus for specified location' })
  async findMenuByLocation(
    @Param('location') location: 'header' | 'footer',
  ): Promise<ApiResponseDto<any[]>> {
    const result = await this.menuService.findMenuByLocation(location);
    return ApiResponseDto.success(result);
  }
}

