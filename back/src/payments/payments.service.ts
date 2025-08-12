import { Injectable } from '@nestjs/common';
import * as mercadopago from 'mercadopago';
import { OrdersService } from 'src/orders/orders.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService
  ) {
    mercadopago.configure({
      access_token: this.configService.get<string>('MP_ACCESS_TOKEN'),
    });
  }

  async createPayment(orderId: string, userId: string) {
    const order = await this.ordersService.findOne(orderId, userId);

    const preference = {
      items: order.orderDetails.products.map((p) => ({
        title: p.name,
        unit_price: Number(p.price),
        quantity: 1,
        currency_id: 'ARS',
      })),
      back_urls: {
        success: `http://localhost:3001/payment/success/${orderId}`,
        failure: `http://localhost:3001/payment/failure/${orderId}`,
        pending: `http://localhost:3001/payment/pending/${orderId}`,
      },
      notification_url: `http://localhost:3001/payments/webhook`,
      auto_return: 'approved',
    };

    const response = await mercadopago.preferences.create(preference);
    return { init_point: response.body.init_point };
  }

  async processWebhook(body: any) {
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      const payment = await mercadopago.payment.findById(paymentId);

      if (payment.body.status === 'approved') {
        const externalRef = payment.body.external_reference;
        await this.ordersService.updateStatus(externalRef, 'finalizado');
      }
    }
  }
}
