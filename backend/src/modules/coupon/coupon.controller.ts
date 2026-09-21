import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { Public } from '@shared/decorators/public.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';

@ApiTags('Coupons')
@Controller('coupons')
@Public()
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get currently active coupons for customers' })
  @ApiResponse({ status: 200, description: 'Return active coupons' })
  async findActive(): Promise<ApiResponseDto<any[]>> {
    const result = await this.couponService.findActive();
    return ApiResponseDto.success(result);
  }
}

