import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { AdminStoreController } from './admin-store.controller';
import { PublicStoreController } from './public-store.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StoreController, AdminStoreController, PublicStoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
