import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';

// Config
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { adminJwtConfig, customerJwtConfig } from './config/jwt.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MediaModule } from './modules/media/media.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { PageModule } from './modules/page/page.module';
import { BannerModule } from './modules/banner/banner.module';
import { StoreModule } from './modules/store/store.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { DiscountCodeModule } from './modules/discount-code/discount-code.module';
import { OrderModule } from './modules/order/order.module';
import { CartModule } from './modules/cart/cart.module';
import { HealthModule } from './modules/health/health.module';
import { SharedModule } from './shared/shared.module';
import { CustomerAuthModule } from './modules/customer-auth/customer-auth.module';
import { CustomerAddressModule } from './modules/customer-address/customer-address.module';
import { CustomerModule } from './modules/customer/customer.module';
import { MenuModule } from './modules/menu/menu.module';

// Guards
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, adminJwtConfig, customerJwtConfig],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Task Scheduling
    ScheduleModule.forRoot(),

    // Serve static files (uploads directory)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // I18n Module
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: join(__dirname, '/locales/'),
        watch: true,
      },
      resolvers: [
        new HeaderResolver(['language', 'lang']),
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),

    // Shared Module (Global)
    SharedModule,

    // Feature modules
    AuthModule,
    UserModule,
    MediaModule,
    CategoryModule,
    ProductModule,
    PageModule,
    BannerModule,
    StoreModule,
    CouponModule,
    DiscountCodeModule,
    OrderModule,
    CartModule,
    HealthModule,
    CustomerAuthModule,
    CustomerAddressModule,
    CustomerModule,
    MenuModule,
  ],
  providers: [
    // Note: Guards are applied at controller/route level to ensure proper execution order
    // JwtAuthGuard must run before RolesGuard, so they cannot be global
    // This also allows different JWT strategies (admin-jwt vs customer-jwt) to work independently
  ],
})
export class AppModule {}
