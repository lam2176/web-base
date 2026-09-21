import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { AdminProductController } from './admin-product.controller';
import { ProductService } from './product.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProductController, AdminProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
