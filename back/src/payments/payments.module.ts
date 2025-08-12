import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
