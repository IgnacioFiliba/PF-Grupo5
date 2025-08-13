import {
  Body, Controller, Post, Get, Patch, Delete,
  Param, Req, Res, UseGuards
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateQuantityDto } from './dto/update-quantity.dto';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartsService: CartService) {}

  private async resolveCart(req: any) {
    const userId = req.user?.id;
    const cookieCartId = req.cookies?.cart_id;
    return this.cartsService.getOrCreateCart({ userId, cookieCartId });
  }

  private mapForFront(cart: any) {
    return {
      id: cart.id,
      status: cart.status,
      subtotal: Number(cart.subtotal),
      total: Number(cart.total),
      currency: cart.currency,
      items: cart.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        unitPrice: Number(it.unitPriceCurrent),
        lineTotal: Number(it.unitPriceCurrent) * it.quantity,
        isValid: it.isValid,
        product: {
          id: it.product.id,
          name: it.productNameSnapshot ?? (it.product as any).name,
          price: Number(it.unitPriceCurrent),
          imageUrl: it.imageUrlSnapshot ?? (it.product as any).imageUrl ?? null,
        },
      })),
      lastValidatedAt: cart.lastValidatedAt,
      updatedAt: cart.updatedAt,
    };
  }

  // Crear carrito invitado (y setear cookie)
  @Post()
  @ApiOperation({ summary: 'Crear carrito (invitado)' })
  async create(@Res({ passthrough: true }) res: Response) {
    const cart = await this.cartsService.getOrCreateCart({});
    res.cookie('cart_id', cart.id, {
      httpOnly: true, sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 días
    });
    return this.mapForFront(cart);
  }

  // Obtener carrito actual (por cookie o user)
  @Get('me')
  @ApiOperation({ summary: "Obtener el carrito vigente (guest o usuario); si no existe, lo crea. Renueva la cookie 'cart_id'. No revalida precios/stock."})
  async me(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const cart = await this.resolveCart(req);
    // refresca vigencia de cookie
    res.cookie('cart_id', cart.id, {
      httpOnly: true, sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    return this.mapForFront(cart);
  }

  // Agregar item
  @Post('items')
  @ApiOperation({ summary: 'Agregar item al carrito' })
  async addItem(@Req() req: any, @Body() dto: AddItemDto) {
    const cart = await this.resolveCart(req);
    const updated = await this.cartsService.addItem(cart, dto);
    return this.mapForFront(updated);
  }

  // Cambiar cantidad (0 = eliminar)
  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Actualizar cantidad de un item' })
  async updateQty(@Req() req: any, @Param('itemId') itemId: string, @Body() dto: UpdateQuantityDto) {
    const cart = await this.resolveCart(req);
    const updated = await this.cartsService.updateQuantity(cart, itemId, dto);
    return this.mapForFront(updated);
  }

  // Eliminar item
  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Eliminar item del carrito' })
  async remove(@Req() req: any, @Param('itemId') itemId: string) {
    const cart = await this.resolveCart(req);
    const updated = await this.cartsService.removeItem(cart, itemId);
    return this.mapForFront(updated);
  }

  // Revalidar todo (precio/stock)
  @Post('refresh')
  @ApiOperation({ summary: 'Revalidar carrito (precio/stock)' })
  async refresh(@Req() req: any) {
    const cart = await this.resolveCart(req);
    const result = await this.cartsService.refresh(cart.id);
    return {
      cart: this.mapForFront(result.cart),
      changes: result.changes,
    };
  }

  // Fusionar carrito invitado -> usuario al iniciar sesión
  @Post('merge')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Fusionar carrito de invitado con el del usuario' })
  async merge(@Req() req: any) {
    const userCart = await this.cartsService.getOrCreateCart({ userId: req.user.id });
    const guestCartId = req.cookies?.cart_id;
    if (!guestCartId || guestCartId === userCart.id) return this.mapForFront(userCart);
    const merged = await this.cartsService.mergeCarts(userCart.id, guestCartId);
    return this.mapForFront(merged);
  }

  // Validación estricta previa a checkout
  @Post('checkout/validate')
  @ApiOperation({ summary: 'Validar carrito antes de checkout' })
  async validate(@Req() req: any) {
    const cart = await this.resolveCart(req);
    const validated = await this.cartsService.validateBeforeCheckout(cart.id);
    return this.mapForFront(validated);
  }
}