import { Controller, Post, Param, Req, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Request } from 'express';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create/:orderId')
  @UseGuards(AuthGuard)
  createPayment(@Param('orderId') orderId: string, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.paymentsService.createPayment(orderId, req.user.id);
  }

  @Post('webhook')
  async webhook(@Body() body: any) {
    await this.paymentsService.processWebhook(body);
    return { status: 'ok' };
  }
}
