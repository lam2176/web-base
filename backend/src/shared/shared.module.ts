import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './services/logger.service';
import { SupabaseService } from './services/supabase.service';
import { UploadService } from './services/upload.service';
import { I18nService } from './services/i18n.service';
import { EmailService } from './services/email.service';
import { OtpService } from './services/otp.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LoggerService,
    SupabaseService,
    UploadService,
    I18nService,
    EmailService,
    OtpService,
  ],
  exports: [
    LoggerService,
    SupabaseService,
    UploadService,
    I18nService,
    EmailService,
    OtpService,
  ],
})
export class SharedModule {}
