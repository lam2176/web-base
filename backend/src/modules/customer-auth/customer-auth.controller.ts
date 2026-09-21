import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerRegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { CustomerLoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '@/shared/decorators/public.decorator';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RefreshTokenExpiredException } from '@shared/exceptions/refresh-token-expired.exception';

@ApiTags('👥 Customer Authentication')
@Controller('customer-auth')
@Public()
@UseGuards(ThrottlerGuard)
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register new customer',
    description: 'Register a new customer account. OTP will be sent to email for verification.'
  })
  @ApiResponse({ status: 200, description: 'Registration initiated, OTP sent to email' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() registerDto: CustomerRegisterDto) {
    return this.customerAuthService.register(registerDto);
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute - prevent OTP guessing
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP',
    description: 'Verify OTP code and activate customer account. Returns JWT tokens on success.'
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully, returns JWT tokens' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.customerAuthService.verifyOtp(verifyOtpDto);

    // Set refresh token in HTTP-only cookie
    response.cookie('customer_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Don't return refresh token in response body
    const { refreshToken, ...responseData } = result;
    return responseData;
  }

  @Post('resend-otp')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes - prevent OTP spam
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP',
    description: 'Resend OTP code to customer email'
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Customer not found or email already verified' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.customerAuthService.resendOtp(resendOtpDto.email);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute - prevent brute force
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Customer login',
    description: 'Login for verified customers. Returns JWT tokens on success.'
  })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or email not verified' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() loginDto: CustomerLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.customerAuthService.login(loginDto);

    // Check if verification is required (email not verified)
    if ('requiresVerification' in result && result.requiresVerification) {
      // Don't set cookie, just return the verification required response
      return result;
    }

    // At this point, TypeScript knows result has refreshToken
    // Cast to the successful login type
    const loginResult = result as {
      customer: any;
      accessToken: string;
      refreshToken: string;
    };

    // Set refresh token in HTTP-only cookie for successful login
    response.cookie('customer_refresh_token', loginResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Don't return refresh token in response body
    const { refreshToken, ...responseData } = loginResult;
    return responseData;
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes - prevent password reset spam
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Request password reset. OTP will be sent to email if account exists.'
  })
  @ApiResponse({ status: 200, description: 'If email exists, OTP has been sent' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.customerAuthService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset password using OTP code sent to email'
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.customerAuthService.resetPassword(resetPasswordDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh customer access token',
    description: 'Get new access token using refresh token from cookie'
  })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 440, description: 'Refresh token expired' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['customer_refresh_token'];

    if (!refreshToken) {
      throw new RefreshTokenExpiredException('Refresh token not found');
    }

    const result = await this.customerAuthService.refreshToken(refreshToken);

    // Set new refresh token in HTTP-only cookie
    response.cookie('customer_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Don't return refresh token in response body
    const { refreshToken: _, ...responseData } = result;
    return responseData;
  }

  @Post('logout')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('customer-jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Customer logout',
    description: 'Logout customer and invalidate refresh token'
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.customerAuthService.logout(user.id);

    // Clear refresh token cookie
    response.clearCookie('customer_refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
