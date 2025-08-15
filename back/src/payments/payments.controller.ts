import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @ApiTags('payments')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('checkout/:orderId')
  @ApiOperation({ summary: 'Crear preferencia de pago de Mercado Pago' })
  @ApiParam({
    name: 'orderId',
    example: '77bd2cdb-9955-4849-abbd-33f064905946',
  })
  async checkout(@Param('orderId') orderId: string) {
    return this.payments.createCheckoutPreference(orderId);
  }
  @Post('success') success() {
    return { ok: true, message: 'Pago aprobado' };
  }
  @Post('failure') failure() {
    return { ok: false, message: 'Pago rechazado' };
  }
  @Post('pending') pending() {
    return { ok: true, message: 'Pago pendiente' };
  }
}
