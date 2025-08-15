import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Products } from 'src/products/entities/product.entity';
import { CartStatus } from './cart.types';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(Products) private readonly productRepo: Repository<Products>,
    // ❌ Eliminado: @InjectRepository(Users) private readonly userRepo: Repository<Users>,
  ) {}

  /**
   * Devuelve SIEMPRE un carrito OPEN (lo crea si allowCreate = true).
   * - Si viene userId: carrito de ese usuario.
   * - Si no: carrito de invitado (user IS NULL). (Modelo simple: 1 guest cart global)
   */
  async getOrCreateCart(params: { userId?: string; allowCreate: boolean }): Promise<Cart> {
    const { userId, allowCreate } = params;

    if (userId) {
      let cart = await this.cartRepo.findOne({
        where: { user: { id: userId }, status: CartStatus.OPEN },
        relations: ['items', 'items.product'],
      });

      if (!cart && allowCreate) {
        // ⚠️ No necesitamos cargar Users desde repo; basta con setear la relación por id.
        cart = this.cartRepo.create({
          status: CartStatus.OPEN,
          user: { id: userId } as any,
          items: [],
        });
        cart = await this.cartRepo.save(cart);
      }
      if (!cart) throw new NotFoundException('Open cart not found for user');
      return cart;
    }

    // Invitado: un OPEN cart con user IS NULL (modelo simple)
    let cart = await this.cartRepo.findOne({
      where: { user: IsNull(), status: CartStatus.OPEN },
      relations: ['items', 'items.product'],
    });

    if (!cart && allowCreate) {
      cart = this.cartRepo.create({
        status: CartStatus.OPEN,
        user: null as any,
        items: [],
      });
      cart = await this.cartRepo.save(cart);
    }
    if (!cart) throw new NotFoundException('Open guest cart not found');
    return cart;
  }

  /** Proyección amigable para UI y Mercado Pago */
  buildCartView(cart: Cart) {
    const items = (cart.items ?? []).map((i) => {
      const p: any = i.product as any;
      const price = Number(p.price) || 0;
      return {
        itemId: i.id,
        productId: i.product.id,
        name: p.name ?? p.title ?? 'Producto',
        image: p.imgUrl ?? p.imageUrl ?? null, // tu entidad usa imgUrl
        price,
        quantity: i.quantity,
        lineTotal: price * i.quantity,
      };
    });

    const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
    const total = subtotal; // agrega impuestos/envío si aplica

    const mpItems = items.map((i) => ({
      title: i.name,
      quantity: i.quantity,
      unit_price: i.price,
      currency_id: 'COP', // ajusta moneda si es necesario
      picture_url: i.image ?? undefined,
    }));

    return { id: cart.id, status: cart.status, items, subtotal, total, mpItems };
  }

  /** Agregar producto (crea carrito si no existe). Suma cantidad si ya está. */
  async addItem(params: { userId?: string; productId: string; quantity: number }) {
    const { userId, productId, quantity } = params;
    const cart = await this.getOrCreateCart({ userId, allowCreate: true });

    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    // (opcional) validar stock: si tu Products tiene `stock`
    if (typeof (product as any).stock === 'number') {
      const existingQty =
        (await this.cartItemRepo.findOne({
          where: { cart: { id: cart.id }, product: { id: product.id } },
        }))?.quantity ?? 0;
      const want = existingQty + quantity;
      if ((product as any).stock < want) {
        throw new BadRequestException(`Stock insuficiente. Disponible: ${(product as any).stock}`);
      }
    }

    const existing = await this.cartItemRepo.findOne({
      where: { cart: { id: cart.id }, product: { id: product.id } },
      relations: ['product', 'cart'],
    });

    if (existing) {
      existing.quantity += quantity;
      await this.cartItemRepo.save(existing);
    } else {
      const item = this.cartItemRepo.create({ cart, product, quantity });
      await this.cartItemRepo.save(item);
    }

    cart.items = await this.cartItemRepo.find({ where: { cart: { id: cart.id } }, relations: ['product'] });
    this.recalcCartTotals(cart);
    await this.cartRepo.save(cart);

    return this.buildCartView(cart);
  }

  /** Actualizar cantidad por itemId (0 = eliminar) */
  async updateItemQty(params: { userId?: string; itemId: string; quantity: number }) {
    const { userId, itemId, quantity } = params;
    const cart = await this.getOrCreateCart({ userId, allowCreate: true });

    const item = await this.cartItemRepo.findOne({
      where: { id: itemId, cart: { id: cart.id } },
      relations: ['product'],
    });
    if (!item) throw new NotFoundException('Item not found in cart');

    if (quantity === 0) {
      await this.cartItemRepo.remove(item);
    } else {
      // (opcional) validar stock
      const p: any = item.product as any;
      if (typeof p.stock === 'number' && p.stock < quantity) {
        throw new BadRequestException(`Stock insuficiente. Disponible: ${p.stock}`);
      }
      item.quantity = Math.max(1, Number(quantity) || 1);
      await this.cartItemRepo.save(item);
    }

    cart.items = await this.cartItemRepo.find({ where: { cart: { id: cart.id } }, relations: ['product'] });
    this.recalcCartTotals(cart);
    await this.cartRepo.save(cart);
    return this.buildCartView(cart);
  }

  /** Eliminar item por itemId */
  async removeItem(params: { userId?: string; itemId: string }) {
    return this.updateItemQty({ ...params, quantity: 0 });
  }

  /** Vaciar carrito */
  async clearCart(params: { userId?: string }) {
    const { userId } = params;
    const cart = await this.getOrCreateCart({ userId, allowCreate: true });

    const items = await this.cartItemRepo.find({ where: { cart: { id: cart.id } } });
    if (items.length) await this.cartItemRepo.remove(items);

    cart.items = [];
    this.recalcCartTotals(cart);
    await this.cartRepo.save(cart);
    return this.buildCartView(cart);
  }

  /** Revalidar carrito contra precios/stock actuales */
  async refresh(params: { userId?: string }) {
    const { userId } = params;
    const cart = await this.getOrCreateCart({ userId, allowCreate: true });

    for (const item of cart.items ?? []) {
      const p = await this.productRepo.findOne({ where: { id: item.product.id } });
      if (!p) continue;
      // clamp por stock si existe
      const stock = (p as any).stock;
      if (typeof stock === 'number' && stock < item.quantity) {
        item.quantity = stock;
        await this.cartItemRepo.save(item);
      }
    }

    cart.items = await this.cartItemRepo.find({ where: { cart: { id: cart.id } }, relations: ['product'] });
    this.recalcCartTotals(cart);
    await this.cartRepo.save(cart);
    return this.buildCartView(cart);
  }

  /** Validación antes de checkout (precios/stock) */
  async validateBeforeCheckout(params: { userId?: string }) {
    const { userId } = params;
    const cart = await this.getOrCreateCart({ userId, allowCreate: true });

    const errors: string[] = [];
    for (const it of cart.items ?? []) {
      const p: any = await this.productRepo.findOne({ where: { id: it.product.id } });
      if (!p) {
        errors.push(`Producto ${it.product.id} no existe`);
        continue;
      }
      if (typeof p.stock === 'number' && p.stock < it.quantity) {
        errors.push(`Stock insuficiente para ${p.name ?? p.title ?? it.product.id}`);
      }
      // Si manejas snapshot de precio, aquí compararías it.unitPrice vs p.price.
    }

    const view = this.buildCartView(cart);
    return { ok: errors.length === 0, errors, cart: view };
  }

  /** (Opcional) Fusionar carrito de invitado con el del usuario – si luego manejas cookie/guestId */
  async mergeGuestIntoUser(_params: { userId: string; guestCartId?: string | null }) {
    // Placeholder: tu modelo actual no usa cookie/guestId,
    // así que aquí no hay nada que fusionar.
    // Cuando implementes cookie cart_id, lo armamos.
    const cart = await this.getOrCreateCart({ userId: _params.userId, allowCreate: true });
    return this.buildCartView(cart);
  }

  /** Si tu entidad Cart tiene columnas de totales, se actualizan aquí */
  private recalcCartTotals(cart: Cart) {
    if (!cart) return;
    const items = (cart.items ?? []).map((i) => {
      const price = Number((i.product as any)?.price) || 0;
      return price * i.quantity;
    });
    const subtotal = items.reduce((s, v) => s + v, 0);
    if ('subtotal' in cart) (cart as any).subtotal = subtotal.toFixed(2);
    if ('total' in cart) (cart as any).total = subtotal.toFixed(2);
  }
}