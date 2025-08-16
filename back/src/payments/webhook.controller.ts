import { Controller, Headers, Post, Query, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import * as crypto from 'crypto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class WebhookController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('webhook')
  async handleWebhook(
    @Query() query: any,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // MP envía ?id o ?data.id (dependiendo del tipo de evento)
      const id = (query['data.id'] || query['id'] || '').toString();
      if (!id) return res.sendStatus(400);

      // Validar firma
      if (!signature || !requestId) return res.sendStatus(401);
      const [pTs, pV1] = signature.split(',');
      const ts = (pTs?.split('=')[1] || '').trim();
      const v1 = (pV1?.split('=')[1] || '').trim();

      const manifest = `id:${id};request-id:${requestId};ts:${ts};`;
      const hash = crypto
        .createHmac('sha256', process.env.MP_WEBHOOK_SECRET!)
        .update(manifest)
        .digest('hex');

      if (hash !== v1) return res.sendStatus(401); // firma inválida

      // OK: Consultá el pago a MP si necesitás más datos (o usá el topic/status del body si lo envían)
      // Aquí simplificamos: asumimos que el body incluye "type" y "data" con id de pago
      // Recomendado: llamar a Payments API para traer status + external_reference
      // Para Checkout Pro, podés consultar /v1/payments/:id o usar el SDK correspondiente.

      // ... pseudo: const payment = await this.consultarPago(id)
      // Ejemplo mínimo: obtén external_reference y status del body si viene
      const { type, data } = (req.body as any) ?? {};
      const mpPaymentId = id;
      // external_reference lo seteaste al crear la preferencia = order.id
      // Si no viene en el body, consultá la API de pagos para obtenerlo (recomendado).
      const status = 'approved'; // reemplazar por el real
      const externalReference = data?.external_reference || 'ORDER_ID_AQUI';

      await this.payments.updateCartFromPayment(
        mpPaymentId,
        status,
        externalReference,
      );

      return res.sendStatus(200);
    } catch (e) {
      return res.sendStatus(500);
    }
  }
}
