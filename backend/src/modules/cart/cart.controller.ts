import { Controller, Post, Get, Put, Delete, Body, Param, Headers, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CalculateCartDto } from './dto/calculate-cart.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Public } from '@shared/decorators/public.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { OptionalCustomerJwtAuthGuard } from '@/modules/customer-auth/guards/optional-customer-jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(OptionalCustomerJwtAuthGuard)
@ApiBearerAuth('customer-jwt')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get cart (public endpoint)',
    description: 'Get cart for current user or session. Requires X-Session-Id header for guest users.'
  })
  @ApiHeader({ name: 'X-Session-Id', required: false, description: 'Session ID for guest users' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  async getCart(
    @CurrentUser() user: { id: number } | null,
    @Headers('x-session-id') sessionId?: string
  ): Promise<ApiResponseDto<any>> {
    const customerId = user?.id;
    const cart = await this.cartService.getCart(customerId, sessionId);
    return ApiResponseDto.success(cart, 'Cart retrieved successfully');
  }

  @Post('items')
  @Public()
  @ApiOperation({
    summary: 'Add item to cart (public endpoint)',
    description: 'Add product to cart. Requires X-Session-Id header for guest users.'
  })
  @ApiHeader({ name: 'X-Session-Id', required: false, description: 'Session ID for guest users' })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully' })
  async addToCart(
    @CurrentUser() user: { id: number } | null,
    @Body() addToCartDto: AddToCartDto,
    @Headers('x-session-id') sessionId?: string
  ): Promise<ApiResponseDto<any>> {
    const customerId = user?.id;
    const item = await this.cartService.addToCart(addToCartDto, customerId, sessionId);
    return ApiResponseDto.success(item, 'Item added to cart successfully');
  }

  @Put('items/:id')
  @Public()
  @ApiOperation({
    summary: 'Update cart item quantity (public endpoint)',
    description: 'Update quantity of a cart item. Requires X-Session-Id header for guest users.'
  })
  @ApiHeader({ name: 'X-Session-Id', required: false, description: 'Session ID for guest users' })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully' })
  async updateCartItem(
    @CurrentUser() user: { id: number } | null,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCartItemDto,
    @Headers('x-session-id') sessionId?: string
  ): Promise<ApiResponseDto<any>> {
    const customerId = user?.id;
    const item = await this.cartService.updateCartItem(id, updateDto, customerId, sessionId);
    return ApiResponseDto.success(item, 'Cart item updated successfully');
  }

  @Delete('items/:id')
  @Public()
  @ApiOperation({
    summary: 'Remove item from cart (public endpoint)',
    description: 'Remove item from cart. Requires X-Session-Id header for guest users.'
  })
  @ApiHeader({ name: 'X-Session-Id', required: false, description: 'Session ID for guest users' })
  @ApiResponse({ status: 200, description: 'Item removed from cart successfully' })
  async removeCartItem(
    @CurrentUser() user: { id: number } | null,
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-session-id') sessionId?: string
  ): Promise<ApiResponseDto<any>> {
    const customerId = user?.id;
    const result = await this.cartService.removeCartItem(id, customerId, sessionId);
    return ApiResponseDto.success(result, 'Item removed from cart successfully');
  }

  @Delete()
  @Public()
  @ApiOperation({
    summary: 'Clear cart (public endpoint)',
    description: 'Remove all items from cart. Requires X-Session-Id header for guest users.'
  })
  @ApiHeader({ name: 'X-Session-Id', required: false, description: 'Session ID for guest users' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  async clearCart(
    @CurrentUser() user: { id: number } | null,
    @Headers('x-session-id') sessionId?: string
  ): Promise<ApiResponseDto<any>> {
    const customerId = user?.id;
    const result = await this.cartService.clearCart(customerId, sessionId);
    return ApiResponseDto.success(result, 'Cart cleared successfully');
  }

  @Post('calculate')
  @Public()
  @ApiOperation({
    summary: 'Calculate cart totals (public endpoint)',
    description: 'Calculate cart subtotal, shipping fee, discount, and total based on items and discount code'
  })
  @ApiResponse({ status: 200, description: 'Cart calculation completed successfully' })
  async calculateCart(@Body() calculateCartDto: CalculateCartDto): Promise<ApiResponseDto<any>> {
    const result = await this.cartService.calculateCart(calculateCartDto);
    return ApiResponseDto.success(result, 'Cart calculated successfully');
  }
}
