import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { db } from '@/db';
import { otpVerifications } from '@/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { randomInt } from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 2; // OTP expires in 2 minutes
  private readonly RESEND_COOLDOWN_MINUTES = 2; // Can resend after 2 minutes

  /**
   * Generate a cryptographically secure random OTP code
   */
  generateOTP(): string {
    // Use crypto.randomInt for secure random number generation
    const min = Math.pow(10, this.OTP_LENGTH - 1);
    const max = Math.pow(10, this.OTP_LENGTH);
    return randomInt(min, max).toString();
  }

  /**
   * Check if can resend OTP (cooldown period)
   */
  async canResendOTP(email: string, type: 'registration' | 'password_reset'): Promise<boolean> {
    const cooldownTime = new Date();
    cooldownTime.setMinutes(cooldownTime.getMinutes() - this.RESEND_COOLDOWN_MINUTES);

    const recentOTP = await db.query.otpVerifications.findFirst({
      where: and(
        eq(otpVerifications.email, email),
        eq(otpVerifications.type, type),
        gt(otpVerifications.createdAt, cooldownTime),
      ),
      orderBy: (otpVerifications, { desc }) => [desc(otpVerifications.createdAt)],
    });

    return !recentOTP;
  }

  /**
   * Create and store OTP in database
   */
  async createOTP(email: string, type: 'registration' | 'password_reset'): Promise<string> {
    // Check resend cooldown
    const canResend = await this.canResendOTP(email, type);
    if (!canResend) {
      throw new BadRequestException(
        `Please wait ${this.RESEND_COOLDOWN_MINUTES} minutes before requesting a new OTP`
      );
    }

    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Invalidate any existing OTP for this email and type
    await db
      .update(otpVerifications)
      .set({ isUsed: true })
      .where(
        and(
          eq(otpVerifications.email, email),
          eq(otpVerifications.type, type),
          eq(otpVerifications.isUsed, false),
        ),
      );

    // Create new OTP
    await db.insert(otpVerifications).values({
      email,
      otp,
      type,
      expiresAt,
      isUsed: false,
    });

    return otp;
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(
    email: string,
    otp: string,
    type: 'registration' | 'password_reset',
  ): Promise<boolean> {
    const result = await db.query.otpVerifications.findFirst({
      where: and(
        eq(otpVerifications.email, email),
        eq(otpVerifications.otp, otp),
        eq(otpVerifications.type, type),
        eq(otpVerifications.isUsed, false),
        gt(otpVerifications.expiresAt, new Date()),
      ),
    });

    if (!result) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Mark OTP as used
    await db
      .update(otpVerifications)
      .set({ isUsed: true })
      .where(eq(otpVerifications.id, result.id));

    return true;
  }

  /**
   * Check if OTP exists and is valid
   */
  async isOTPValid(email: string, type: 'registration' | 'password_reset'): Promise<boolean> {
    const result = await db.query.otpVerifications.findFirst({
      where: and(
        eq(otpVerifications.email, email),
        eq(otpVerifications.type, type),
        eq(otpVerifications.isUsed, false),
        gt(otpVerifications.expiresAt, new Date()),
      ),
    });

    return !!result;
  }

  /**
   * Cleanup expired OTPs - runs every hour
   * Deletes OTPs that have expired or are older than 24 hours
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Delete expired OTPs (expiresAt < now) or OTPs older than 24 hours
      const result = await db
        .delete(otpVerifications)
        .where(lt(otpVerifications.expiresAt, new Date()))
        .returning({ id: otpVerifications.id });

      if (result.length > 0) {
        this.logger.log(`Cleaned up ${result.length} expired OTP(s)`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired OTPs', error);
    }
  }
}
