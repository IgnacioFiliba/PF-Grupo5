import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { OrdersService } from 'src/orders/orders.service';

type PreferenceItemInput = {
  id: string;            // <- requerido por MP v2
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
};

@Injectable()
export class PaymentsService {
  private readonly mpClient: MercadoPagoConfig;
  private readonly preferenceClient: Preference;
  private readonly paymentClient: Payment;

  constructor(private readonly ordersService: OrdersService) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN as string,
      options: { timeout: 5000 },
    });
    this.preferenceClient = new Preference(this.mpClient);
    this.paymentClient = new Payment(this.mpClient);
  }

  /**
   * 👇 Alias para mantener compatibilidad con tu controlador actual
   * Crea una preferencia de pago a partir de un orderId del usuario autenticado.
   */
  async createPayment(orderId: string, userId: string) {
    // Obtenemos la orden para armar los items de la preferencia
    const order = await this.ordersService.findOne(orderId, userId);
    // order.orderDetails.products: [{ id, name, price, ... }]

    // MP v2 exige que cada item tenga "id"
    const items: PreferenceItemInput[] = (order.orderDetails.products ?? []).map(
      (p) => ({
        id: p.id,                       // <- requerido por MP v2
        title: p.name,
        quantity: 1,                    // ajusta si manejas cantidades
        unit_price: Number(p.price),
        currency_id: 'USD',             // ajusta según tu caso
      }),
    );

    const body = {
      items,
      back_urls: {
        success: process.env.MP_SUCCESS_URL ?? 'http://localhost:3000/success',
        failure: process.env.MP_FAILURE_URL ?? 'http://localhost:3000/failure',
        pending: process.env.MP_PENDING_URL ?? 'http://localhost:3000/pending',
      },
      auto_return: 'approved' as const,
      external_reference: orderId, // para enlazar notificación con tu orden
      notification_url:
        process.env.MP_WEBHOOK_URL ??
        'http://localhost:3001/payments/webhook', // Asegúrate que sea público en prod
    };

    // Tipado correcto para MP v2
    const pref = await this.preferenceClient.create({ body });
    return pref; // { id, init_point, ... }
  }

  /**
   * Crea una preferencia con items “custom” (si lo usas desde Swagger o el front)
   */
  async createPreference(input: {
    items: PreferenceItemInput[];
    externalReference?: string;
    successUrl?: string;
    failureUrl?: string;
    pendingUrl?: string;
    notificationUrl?: string;
  }) {
    const {
      items,
      externalReference,
      successUrl,
      failureUrl,
      pendingUrl,
      notificationUrl,
    } = input;

    const body = {
      items: items.map((i) => ({
        id: i.id, // <- requerido por MP v2
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price,
        currency_id: i.currency_id ?? 'USD',
      })),
      back_urls: {
        success: successUrl ?? process.env.MP_SUCCESS_URL ?? 'http://localhost:3000/success',
        failure: failureUrl ?? process.env.MP_FAILURE_URL ?? 'http://localhost:3000/failure',
        pending: pendingUrl ?? process.env.MP_PENDING_URL ?? 'http://localhost:3000/pending',
      },
      auto_return: 'approved' as const,
      external_reference: externalReference,
      notification_url:
        notificationUrl ??
        process.env.MP_WEBHOOK_URL ??
        'http://localhost:3001/payments/webhook',
    };

    const pref = await this.preferenceClient.create({ body });
    return pref;
  }

  async getPaymentById(paymentId: string) {
    return this.paymentClient.get({ id: paymentId });
  }

  /**
   * 👇 Alias para mantener compatibilidad con tu controlador actual
   * Procesa la notificación de MP (v2): { type, data: { id } }
   */
  async processWebhook(payload: { type?: string; data?: { id?: string } }) {
    const { type, data } = payload;

    if (type === 'payment' && data?.id) {
      const payment = await this.paymentClient.get({ id: data.id });
      const status = (payment?.status as string) ?? 'pending';

      const externalReference =
        (payment?.external_reference as string | undefined) ??
        (payment?.order?.id as string | undefined);

      if (externalReference) {
        // Usa tu método actual: updateStatus(orderId, status)
        await this.ordersService.updateStatus(externalReference, status);
      }
    }

    return { received: true };
  }
}