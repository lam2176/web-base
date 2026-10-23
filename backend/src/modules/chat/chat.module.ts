import { Module } from '@nestjs/common';
import { ProductModule } from '../product/product.module';
import { CategoryModule } from '../category/category.module';
import { StoreModule } from '../store/store.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatToolsService } from './chat.tools';

@Module({
  imports: [ProductModule, CategoryModule, StoreModule],
  controllers: [ChatController],
  providers: [ChatService, ChatToolsService],
})
export class ChatModule {}
