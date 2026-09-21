import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DiscountCodeService } from './discount-code.service';
import { ValidateDiscountCodeDto } from './dto/validate-discount-code.dto';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { Public } from '@shared/decorators/public.decorator';

@ApiTags('Discount Codes')
@Controller('discount-codes')
@Public()
export class DiscountCodeController {
  constructor(private readonly discountCodeService: DiscountCodeService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate discount code for customers' })
  @ApiResponse({ status: 200, description: 'Discount code is valid' })
  async validate(
    @Body() validateDiscountCodeDto: ValidateDiscountCodeDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.discountCodeService.validateCode(
      validateDiscountCodeDto.code,
      validateDiscountCodeDto.customerEmail,
      validateDiscountCodeDto.customerPhone,
    );

    if (!result.valid || !result.discountCode) {
      throw new BadRequestException(result.message || 'Invalid discount code');
    }

    return ApiResponseDto.success(result.discountCode, result.message || 'Discount code is valid');
  }
}

