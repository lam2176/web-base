import { Module } from '@nestjs/common';
import { AdminCouponController } from './admin-coupon.controller';
import { CouponService } from './coupon.service';
import { AuthModule } from '../auth/auth.module';
import { CouponController } from './coupon.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdminCouponController, CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
