import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';

import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateQuantityDto } from './dto/update-quantity.dto';
import { Products } from 'src/products/entities/product.entity';

const CART_COOKIE = 'cart_id';
const CART_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 días

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartsRepo: Repository<Cart>,
    @InjectRepository(CartItem) private readonly itemsRepo: Repository<CartItem>,
    @InjectRepository(Products)
    private readonly productsRepo: Repository<Products>, // ajusta a Product si aplica
  ) {}

  // ---------- Cookies ----------
  attachGuestCookie(res: Response, cartId: string) {
    res.cookie(CART_COOKIE, cartId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: CART_COOKIE_MAX_AGE_MS,
    });
  }

  // ---------- helpers ----------
  private async load(id: string) {
    return this.cartsRepo.findOneOrFail({
      where: { id },
      relations: ['items', 'items.product'],
    });
  }

  private async recalc(cartId: string, touch = false) {
    const cart = await this.load(cartId);
    const subtotal = (cart.items ?? []).reduce(
      (acc, it) => acc + Number(it.unitPriceCurrent) * it.quantity,
      0,
    );
    cart.subtotal = subtotal.toFixed(2); // numeric guardado como string
    cart.total = subtotal.toFixed(2);
    if (touch) cart.lastValidatedAt = new Date();
    await this.cartsRepo.save(cart);
  }

  // ---------- API core ----------
  async getOrCreateCart(ctx: { userId?: string; cookieCartId?: string }) {
    // user logueado
    if (ctx.userId) {
      let cart = await this.cartsRepo.findOne({
        where: { user: { id: ctx.userId } as any, status: 'ACTIVE' },
        relations: ['items', 'items.product'],
      });
      if (cart) return cart;
      cart = this.cartsRepo.create({
        user: { id: ctx.userId } as any,
        status: 'ACTIVE',
        items: [],
      });
      return this.cartsRepo.save(cart);
    }

    // invitado con cookie
    if (ctx.cookieCartId) {
      const existing = await this.cartsRepo.findOne({
        where: { id: ctx.cookieCartId, status: 'ACTIVE' },
        relations: ['items', 'items.product'],
      });
      if (existing) return existing;
    }

    // nuevo invitado
    const created = this.cartsRepo.create({ status: 'ACTIVE', items: [] });
    return this.cartsRepo.save(created);
  }

  async addItem(cart: Cart, dto: AddItemDto) {
    const product = await this.productsRepo.findOneByOrFail({ id: dto.productId });

    if (product.stock < dto.quantity) {
      throw new ConflictException({
        message: 'Insufficient stock',
        stock: product.stock,
      });
    }

    let item = cart.items?.find((i) => i.product.id === product.id);
    const priceNow = String(product.price);

    if (item) {
      const newQty = item.quantity + dto.quantity; // idempotente (suma)
      if (product.stock < newQty) {
        throw new ConflictException({
          message: 'Insufficient stock',
          stock: product.stock,
        });
      }
      item.quantity = newQty;
      item.unitPriceCurrent = priceNow;
      item.isValid = true;
      await this.itemsRepo.save(item);
    } else {
      item = this.itemsRepo.create({
        cart,
        product,
        quantity: dto.quantity,
        unitPriceAtAdd: priceNow,
        unitPriceCurrent: priceNow,
        productNameSnapshot: (product as any).name,
        imageUrlSnapshot: (product as any).imageUrl ?? null,
        isValid: true,
      });
      await this.itemsRepo.save(item);
      cart.items = [...(cart.items ?? []), item];
    }

    await this.recalc(cart.id);
    return this.load(cart.id);
  }

  async updateQuantity(cart: Cart, itemId: string, dto: UpdateQuantityDto) {
    const item = await this.itemsRepo.findOne({
      where: { id: itemId },
      relations: ['product', 'cart'],
    });
    if (!item || item.cart.id !== cart.id) throw new NotFoundException();

    if (dto.quantity === 0) {
      await this.itemsRepo.remove(item);
    } else {
      const product = item.product;
      if (product.stock < dto.quantity) {
        throw new ConflictException({
          message: 'Insufficient stock',
          stock: product.stock,
        });
      }
      item.quantity = dto.quantity; // cantidad absoluta
      item.unitPriceCurrent = String(product.price);
      item.isValid = true;
      await this.itemsRepo.save(item);
    }

    await this.recalc(cart.id);
    return this.load(cart.id);
  }

  async removeItem(cart: Cart, itemId: string) {
    const item = await this.itemsRepo.findOne({
      where: { id: itemId },
      relations: ['cart'],
    });
    if (!item || item.cart.id !== cart.id) throw new NotFoundException();
    await this.itemsRepo.remove(item);
    await this.recalc(cart.id);
    return this.load(cart.id);
  }

  // ADICIÓN: vaciar carrito
  async clearCart(cartId: string) {
    const cart = await this.load(cartId);
    if (cart.items?.length) {
      // borrar en bloque
      await this.itemsRepo.remove(cart.items);
    }
    await this.recalc(cart.id);
    return this.load(cart.id);
  }

  async refresh(cartId: string) {
    const cart = await this.load(cartId);
    const changes: any[] = [];

    for (const it of cart.items) {
      const p = await this.productsRepo.findOneByOrFail({ id: it.product.id });

      // precio
      const priceNow = String(p.price);
      if (it.unitPriceCurrent !== priceNow) {
        changes.push({
          itemId: it.id,
          type: 'PRICE_CHANGED',
          old: it.unitPriceCurrent,
          new: priceNow,
        });
        it.unitPriceCurrent = priceNow;
      }

      // stock
      if (p.stock < it.quantity) {
        changes.push({
          itemId: it.id,
          type: 'STOCK_REDUCED',
          requested: it.quantity,
          available: p.stock,
        });
        it.isValid = false;
      } else {
        it.isValid = true;
      }

      await this.itemsRepo.save(it);
    }

    await this.recalc(cart.id, true);
    const updated = await this.load(cart.id);
    return { cart: updated, changes };
  }

  async validateBeforeCheckout(cartId: string) {
    const { cart, changes } = await this.refresh(cartId);
    const invalid = cart.items.filter((i) => !i.isValid);
    if (changes.length || invalid.length) {
      throw new ConflictException({ message: 'Cart needs attention', changes });
    }
    return cart;
  }

  async mergeCarts(userCartId: string, guestCartId: string) {
    if (userCartId === guestCartId) return this.load(userCartId);
    const userCart = await this.load(userCartId);
    const guestCart = await this.load(guestCartId);

    for (const g of guestCart.items) {
      const existing = userCart.items.find((i) => i.product.id === g.product.id);
      const p = await this.productsRepo.findOneByOrFail({ id: g.product.id });
      const combined = (existing?.quantity ?? 0) + g.quantity;
      const finalQty = Math.min(p.stock, combined);
      const priceNow = String(p.price);

      if (existing) {
        existing.quantity = finalQty;
        existing.unitPriceCurrent = priceNow;
        existing.isValid = finalQty > 0 && finalQty <= p.stock;
        await this.itemsRepo.save(existing);
      } else if (finalQty > 0) {
        const newItem = this.itemsRepo.create({
          cart: userCart,
          product: p,
          quantity: finalQty,
          unitPriceAtAdd: priceNow,
          unitPriceCurrent: priceNow,
          productNameSnapshot: (p as any).name,
          imageUrlSnapshot: (p as any).imageUrl ?? null,
          isValid: true,
        });
        await this.itemsRepo.save(newItem);
      }
    }

    await this.cartsRepo.remove(guestCart);
    await this.recalc(userCart.id);
    return this.load(userCart.id);
  }
}