import { Module } from '@nestjs/common';
import { PageService } from './page.service';
import { PageController } from './page.controller';
import { AdminPageController } from './admin-page.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PageController, AdminPageController],
  providers: [PageService],
  exports: [PageService],
})
export class PageModule {}
