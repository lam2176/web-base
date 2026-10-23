import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { HttpExceptionFilter } from '@shared/filters/http-exception.filter';
import { TransformInterceptor } from '@shared/interceptors/transform.interceptor';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';

/**
 * Shared app configuration used by both the long-running server (main.ts)
 * and the Vercel serverless handler (serverless.ts)
 */
export function setupApp(app: INestApplication): void {
  // Behind Vercel's proxy: use X-Forwarded-For so rate limits apply per client, not per proxy
  (app as NestExpressApplication).set('trust proxy', 1);

  // Request body size limits - prevents DoS attacks via large payloads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // Cookie parser
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: configService.get<string[]>('app.corsOrigins'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(configService.get<string>('app.apiPrefix'));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('NextShop E-commerce API')
    .setDescription('E-commerce API with NestJS and Drizzle ORM')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token for admin authentication',
        in: 'header',
      },
      'admin-jwt',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token for customer authentication',
        in: 'header',
      },
      'customer-jwt',
    )
    .addTag('🔐 Admin Authentication', 'Admin/staff authentication and authorization')
    .addTag('👥 Customer Authentication', 'Customer registration, login, and password management')
    .addTag('👤 Customer Profile', 'Customer profile and account management')
    .addTag('📍 Customer Addresses', 'Customer delivery address management')
    .addTag('📦 Customer Orders', 'Customer order history and tracking')
    .addTag('Categories', 'Product categories')
    .addTag('Products', 'Product management')
    .addTag('Pages', 'CMS pages')
    .addTag('Banners', 'Banner/Slider management')
    .addTag('Store', 'Store information')
    .addTag('Orders', 'Order management')
    .addTag('Cart', 'Shopping cart calculation')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
