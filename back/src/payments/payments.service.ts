import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Products } from 'src/products/entities/product.entity';
import { Cart } from 'src/cart/entities/cart.entity';
import { MercadoPagoClient } from './mercadopago.client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly mp: MercadoPagoClient,
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(Products) private productsRepo: Repository<Products>,
  ) {}

  /**
   * Crear preferencia de pago desde un carrito
   */
  async createCheckoutPreference(cartId: string) {
    try {
      // Validaciones básicas de entorno
      if (!process.env.MP_ACCESS_TOKEN) {
        throw new BadRequestException('MP_ACCESS_TOKEN no configurado');
      }
      if (!process.env.APP_BASE_URL) {
        throw new BadRequestException('APP_BASE_URL no configurado');
      }

      // Traer el carrito con sus items y productos
      const cart = await this.cartRepo.findOne({
        where: { id: cartId },
        relations: ['items', 'items.product'],
      });
      if (!cart) throw new NotFoundException('Cart not found');

      if (!cart.items?.length) {
        throw new BadRequestException('Cart has no items');
      }

      // Idempotencia: si ya hay preferencia, devolverla
      if (cart.mpPreferenceId) {
        const { initPoint } = await this.getInitPoint(cart.mpPreferenceId);
        return {
          init_point: initPoint,
          preference_id: cart.mpPreferenceId,
        };
      }

      // Armar items de la preferencia
      const items = cart.items.map((ci) => ({
        id: ci.product.id,
        title: ci.product.name,
        description: ci.product.description ?? undefined,
        quantity: ci.quantity,
        unit_price: Number(ci.product.price),
        currency_id: 'ARS', // o USD si corresponde
        picture_url: ci.product.imgUrl ?? undefined,
      }));

      const preferenceBody = {
        items,
        external_reference: cart.id, // ahora pasamos el cartId
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

      const prefId = (pref as any)?.id ?? (pref as any)?.body?.id;
      const initPoint =
        (pref as any)?.init_point ??
        (pref as any)?.body?.init_point ??
        (pref as any)?.sandbox_init_point ??
        (pref as any)?.body?.sandbox_init_point;

      if (!prefId || !initPoint) {
        console.error('Respuesta inesperada de MP Preference.create:', pref);
        throw new BadRequestException(
          'No se pudo obtener la preferencia de pago (id/init_point)',
        );
      }

      cart.mpPreferenceId = prefId;
      await this.cartRepo.save(cart);

      return { init_point: initPoint, preference_id: prefId };
    } catch (err: any) {
      console.error('Error en createCheckoutPreference:', err);
      const message =
        err?.message ||
        err?.cause?.message ||
        'No se pudo crear la preferencia de pago';
      throw new BadRequestException(message);
    }
  }

  /**
   * Recupera el init_point real de una preferencia existente
   */
  private async getInitPoint(
    preferenceId: string,
  ): Promise<{ initPoint: string }> {
    try {
      const resp = await this.mp.preferenceApi.get({ preferenceId });

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

  /**
   * Actualizar carrito con datos de pago (se llama desde webhook)
   */
  async updateCartFromPayment(
    mpPaymentId: string,
    status: string,
    externalReference: string, // ahora es cartId
  ) {
    try {
      const cart = await this.cartRepo.findOne({
        where: { id: externalReference },
      });
      if (!cart) return;

      cart.mpPaymentId = mpPaymentId;
      await this.cartRepo.save(cart);

      // 👇 Aquí podrías crear la Order a partir del carrito si el pago está approved
      if (status === 'approved') {
        // lógica de crear Order con cart.items
      }
    } catch (err) {
      console.error('Error en updateCartFromPayment:', err);
    }
  }
}
