import { Module } from '@nestjs/common';
import { AdminDiscountCodeController } from './admin-discount-code.controller';
import { DiscountCodeController } from './discount-code.controller';
import { DiscountCodeService } from './discount-code.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminDiscountCodeController, DiscountCodeController],
  providers: [DiscountCodeService],
  exports: [DiscountCodeService],
})
export class DiscountCodeModule {}
