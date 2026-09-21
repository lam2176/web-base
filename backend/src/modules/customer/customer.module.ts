import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { OrderModule } from '../order/order.module';
import { AdminCustomerController } from './admin-customer.controller';

@Module({
  imports: [OrderModule],
  controllers: [CustomerController, AdminCustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
