import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Orders } from 'src/orders/entities/order.entity';
import { OrderDetails } from 'src/orders/entities/order-detail.entity';
import { Products } from 'src/products/entities/product.entity';
import { MercadoPagoClient } from './mercadopago.client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly mp: MercadoPagoClient,
    @InjectRepository(Orders) private ordersRepo: Repository<Orders>,
    @InjectRepository(OrderDetails) private detailsRepo: Repository<OrderDetails>,
    @InjectRepository(Products) private productsRepo: Repository<Products>,
  ) {}

  async createCheckoutPreference(orderId: string) {
    try {
      // Validaciones básicas de entorno
      console.log('Token MP:', process.env.MP_ACCESS_TOKEN);
      console.log('APP_BASE_URL:', process.env.APP_BASE_URL);


      if (!process.env.MP_ACCESS_TOKEN) {
        throw new BadRequestException('MP_ACCESS_TOKEN no configurado');
      }
      if (!process.env.APP_BASE_URL) {
        throw new BadRequestException('APP_BASE_URL no configurado');
      }

      // Traer la orden con sus relaciones
      const order = await this.ordersRepo.findOne({
        where: { id: orderId },
        relations: { user: true, orderDetails: { products: true } },
      });
      if (!order) throw new NotFoundException('Order not found');

      const products = order.orderDetails?.products ?? [];
      if (!products.length) {
        throw new BadRequestException('Order has no products');
      }

      // Idempotencia: ya hay preferencia creada → devolver init_point real consultando a MP
      if (order.mpPreferenceId) {
        const { initPoint } = await this.getInitPoint(order.mpPreferenceId);
        return {
          init_point: initPoint,
          preference_id: order.mpPreferenceId,
        };
      }

      // Armar items de la preferencia
      const items = products.map((p) => ({
        id: p.id,
        title: p.name,
        description: p.description ?? undefined,
        quantity: 1, // adapta si manejás quantity
        unit_price: Number(p.price),
        currency_id: 'ARS', // ajusta según tu caso
        picture_url: p.imgUrl ?? undefined,
      }));

      const preferenceBody = {
        items,
        external_reference: order.id, // para mapear luego en el webhook
        notification_url: `${process.env.APP_BASE_URL}/payments/webhook`,
        back_urls: {
          success: `${process.env.APP_BASE_URL}/payments/success`,
          failure: `${process.env.APP_BASE_URL}/payments/failure`,
          pending: `${process.env.APP_BASE_URL}/payments/pending`,
        },
        auto_return: 'approved',
      };

      // SDK v2: se envía { body: ... }
      const pref = await this.mp.preferenceApi.create({ body: preferenceBody });

      // Soporte robusto a distintas formas de respuesta (algunas guías usan .body.*)
      const prefId = (pref as any)?.id ?? (pref as any)?.body?.id ?? undefined;
      const initPoint =
        (pref as any)?.init_point ??
        (pref as any)?.body?.init_point ??
        undefined;

      if (!prefId || !initPoint) {
        // Log para debug local si llega a pasar

        console.error('Respuesta inesperada de MP Preference.create:', pref);
        throw new BadRequestException(
          'No se pudo obtener la preferencia de pago (id/init_point)',
        );
      }

      order.mpPreferenceId = prefId;
      await this.ordersRepo.save(order);

      return { init_point: initPoint, preference_id: prefId };
    } catch (err: any) {
      console.error('Error en createCheckoutPreference:', err);
      // Si el SDK trae detalle en err.message o err.cause, exponelo de forma legible
      const message =
        err?.message ||
        err?.cause?.message ||
        'No se pudo crear la preferencia de pago';
      throw new BadRequestException(message);
    }
  }

  /**
   * Intenta leer el init_point real de una preferencia existente.
   * Usa SDK v2: preference.get({ preferenceId })
   */
  private async getInitPoint(
    preferenceId: string,
  ): Promise<{ initPoint: string }> {
    try {
      const resp = await this.mp.preferenceApi.get({ preferenceId });

      // Manejo robusto: resp.init_point o resp.body.init_point
      const initPoint =
        (resp as any)?.init_point ??
        (resp as any)?.body?.init_point ??
        (resp as any)?.sandbox_init_point ??
        (resp as any)?.body?.sandbox_init_point;

      if (!initPoint) {
        console.error('Respuesta inesperada de MP Preference.get:', resp);
        throw new BadRequestException('No se pudo recuperar init_point');
      }

      return { initPoint };
    } catch (err: any) {
      console.error('Error en getInitPoint:', err);
      throw new BadRequestException(
        'No se pudo recuperar la preferencia existente',
      );
    }
  }

  async updateOrderFromPayment(
    mpPaymentId: string,
    status: string,
    externalReference: string,
  ) {
    try {
      const order = await this.ordersRepo.findOne({
        where: { id: externalReference },
      });
      if (!order) return;

      order.mpPaymentId = mpPaymentId;
      // Estados posibles MP: approved | rejected | pending | in_process | cancelled | refunded | charged_back
      order.status = status as any;
      await this.ordersRepo.save(order);
    } catch (err) {
      console.error('Error en updateOrderFromPayment:', err);
      // No re-lanzamos para no romper el webhook
    }
  }
}
