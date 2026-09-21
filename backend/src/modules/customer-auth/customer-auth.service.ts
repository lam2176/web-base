import { Injectable, BadRequestException, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/shared/services/email.service';
import { OtpService } from '@/shared/services/otp.service';
import { RefreshTokenExpiredException } from '@shared/exceptions/refresh-token-expired.exception';
import { CustomerRegisterDto } from './dto/register.dto';
import { CustomerLoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class CustomerAuthService {
  private readonly logger = new Logger(CustomerAuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private otpService: OtpService,
  ) {}

  /**
   * Register new customer - Step 1: Create pending account and send OTP
   */
  async register(registerDto: CustomerRegisterDto) {
    // Check if email already exists
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.email, registerDto.email),
    });

    if (existingCustomer) {
      // If email exists but not verified, resend OTP
      if (!existingCustomer.isEmailVerified) {
        // Update customer info if provided
        await db
          .update(customers)
          .set({
            fullName: registerDto.fullName,
            phoneNumber: registerDto.phoneNumber,
            password: await bcrypt.hash(registerDto.password, 10),
          })
          .where(eq(customers.id, existingCustomer.id));

        // Generate and send new OTP
        const otp = await this.otpService.createOTP(registerDto.email, 'registration');
        await this.emailService.sendRegistrationOTP(registerDto.email, otp, registerDto.fullName);

        return {
          message: 'Email already registered but not verified. A new OTP has been sent to your email.',
          email: existingCustomer.email,
        };
      }

      // Email already verified
      throw new ConflictException('Email already registered and verified');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create customer account (not verified yet)
    const [customer] = await db
      .insert(customers)
      .values({
        email: registerDto.email,
        password: hashedPassword,
        fullName: registerDto.fullName,
        phoneNumber: registerDto.phoneNumber,
        isEmailVerified: false,
        isActive: true,
      })
      .returning();

    // Generate and send OTP
    const otp = await this.otpService.createOTP(registerDto.email, 'registration');
    await this.emailService.sendRegistrationOTP(registerDto.email, otp, registerDto.fullName);

    return {
      message: 'Registration initiated. Please check your email for OTP verification.',
      email: customer.email,
    };
  }

  /**
   * Verify OTP and activate customer account
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    // Verify OTP
    await this.otpService.verifyOTP(verifyOtpDto.email, verifyOtpDto.otp, 'registration');

    // Find customer
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, verifyOtpDto.email),
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Mark email as verified
    await db
      .update(customers)
      .set({ isEmailVerified: true })
      .where(eq(customers.id, customer.id));

    // Send welcome email
    await this.emailService.sendWelcomeEmail(customer.email, customer.fullName);

    // Generate tokens
    const tokens = this.generateTokens(customer.id, customer.email);

    // Update last login
    await db
      .update(customers)
      .set({ lastLoginAt: new Date() })
      .where(eq(customers.id, customer.id));

    this.logger.debug(`OTP verified - Email: ${customer.email}, FullName: "${customer.fullName}"`);

    return {
      message: 'Email verified successfully',
      ...tokens,
      customer: {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName || 'Khách hàng', // Fallback if fullName is null
        phoneNumber: customer.phoneNumber,
      },
    };
  }

  /**
   * Resend OTP
   */
  async resendOtp(email: string) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, email),
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    if (customer.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate and send new OTP
    const otp = await this.otpService.createOTP(email, 'registration');
    await this.emailService.sendRegistrationOTP(email, otp, customer.fullName);

    return {
      message: 'OTP sent successfully',
    };
  }

  /**
   * Customer login
   */
  async login(loginDto: CustomerLoginDto) {
    // Find customer
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, loginDto.email),
    });

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password first
    const isPasswordValid = await bcrypt.compare(loginDto.password, customer.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified - if not, send OTP
    if (!customer.isEmailVerified) {
      // Generate and send OTP
      const otp = await this.otpService.createOTP(loginDto.email, 'registration');
      await this.emailService.sendRegistrationOTP(loginDto.email, otp, customer.fullName);

      // Return special response indicating OTP sent
      return {
        requiresVerification: true,
        message: 'Email not verified. An OTP has been sent to your email.',
        email: customer.email,
      };
    }

    // Check if account is active
    if (!customer.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate tokens
    const tokens = this.generateTokens(customer.id, customer.email);

    // Update last login
    await db
      .update(customers)
      .set({ lastLoginAt: new Date() })
      .where(eq(customers.id, customer.id));

    // Log customer data for debugging
    this.logger.debug(`Login successful - Email: ${customer.email}, FullName: "${customer.fullName}"`);

    return {
      ...tokens,
      customer: {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName || 'Khách hàng', // Fallback if fullName is null
        phoneNumber: customer.phoneNumber,
      },
    };
  }

  /**
   * Forgot password - Send OTP
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, forgotPasswordDto.email),
    });

    if (!customer) {
      // Don't reveal if email exists or not for security
      return {
        message: 'If the email exists, an OTP has been sent',
      };
    }

    // Generate and send OTP
    const otp = await this.otpService.createOTP(forgotPasswordDto.email, 'password_reset');
    await this.emailService.sendPasswordResetOTP(forgotPasswordDto.email, otp, customer.fullName);

    return {
      message: 'If the email exists, an OTP has been sent',
    };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // Verify OTP
    await this.otpService.verifyOTP(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      'password_reset',
    );

    // Find customer
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, resetPasswordDto.email),
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update password
    await db
      .update(customers)
      .set({ password: hashedPassword })
      .where(eq(customers.id, customer.id));

    return {
      message: 'Password reset successfully',
    };
  }

  /**
   * Generate JWT tokens for customer
   */
  private generateTokens(customerId: number, email: string) {
    const payload = { sub: customerId, email, type: 'customer' };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('customerJwt.secret'),
      expiresIn: this.configService.get<string>('customerJwt.accessTokenExpiry') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('customerJwt.secret'),
      expiresIn: this.configService.get<string>('customerJwt.refreshTokenExpiry') as any,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh customer tokens
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('customerJwt.secret'),
      });

      // Ensure this is a customer token
      if (payload.type !== 'customer') {
        throw new UnauthorizedException('Invalid customer refresh token');
      }

      const customer = await db.query.customers.findFirst({
        where: eq(customers.id, payload.sub),
      });

      if (!customer || !customer.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens(customer.id, customer.email);

      return {
        ...tokens,
        customer: {
          id: customer.id,
          email: customer.email,
          fullName: customer.fullName || 'Khách hàng',
          phoneNumber: customer.phoneNumber,
        },
      };
    } catch (error) {
      // If token expired, throw 440
      if (error.name === 'TokenExpiredError') {
        throw new RefreshTokenExpiredException('Customer refresh token expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Customer logout
   */
  async logout(customerId: number): Promise<void> {
    // You can add logic here to invalidate the refresh token if storing it in DB
    // For now, the cookie will be cleared by the controller
    this.logger.debug(`Customer logged out - ID: ${customerId}`);
  }

  /**
   * Validate customer by ID (used by JWT strategy)
   */
  async validateCustomer(customerId: number) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });

    if (!customer || !customer.isActive) {
      return null;
    }

    return {
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
    };
  }
}
