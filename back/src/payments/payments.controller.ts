import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('checkout/:cartId')
  @ApiOperation({
    summary: 'Crear preferencia de pago de Mercado Pago a partir del Cart',
  })
  @ApiParam({
    name: 'cartId',
    example: '77bd2cdb-9955-4849-abbd-33f064905946',
  })
  async checkout(@Param('cartId') cartId: string) {
    return this.payments.createCheckoutPreference(cartId);
  }

  @Post('success')
  success() {
    return { ok: true, message: 'Pago aprobado' };
  }

  @Post('failure')
  failure() {
    return { ok: false, message: 'Pago rechazado' };
  }

  @Post('pending')
  pending() {
    return { ok: true, message: 'Pago pendiente' };
  }
}
