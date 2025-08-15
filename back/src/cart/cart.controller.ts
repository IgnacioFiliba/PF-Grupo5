import {
  Controller, Post, Get, Patch, Delete, Param, Body, Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CartService } from './cart.service';

class AddItemDto {
  productId!: string;
  quantity!: number;
  // opcional si aún no tienes JWT conectado:
  userId?: string;
}
class UpdateQtyDto {
  quantity!: number; // 0 = eliminar
}

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private getUserId(req: Request) {
    // Si tienes guard que añade req.user.sub, úsalo. Si no, deja userId vacío (guest).
    return (req as any)?.user?.sub ?? undefined;
  }

  @ApiOperation({ summary: 'Crear carrito (invitado)' })
  @Post()
  async createCart(@Req() req: Request) {
    const userId = this.getUserId(req);
    const cart = await this.cartService.getOrCreateCart({ userId, allowCreate: true });
    return this.cartService.buildCartView(cart);
  }

  @ApiOperation({ summary: 'Obtener el carrito vigente (alias de /cart/me). No revalida precios/stock.' })
  @Get()
  async getCart(@Req() req: Request) {
    const userId = this.getUserId(req);
    const cart = await this.cartService.getOrCreateCart({ userId, allowCreate: true });
    return this.cartService.buildCartView(cart);
  }

  @ApiOperation({ summary: 'Vaciar el carrito (elimina todos los items)' })
  @Delete()
  async clear(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.cartService.clearCart({ userId });
  }

  @ApiOperation({ summary: "Obtener el carrito vigente (guest o usuario); si no existe, lo crea." })
  @Get('me')
  async getMe(@Req() req: Request) {
    const userId = this.getUserId(req);
    const cart = await this.cartService.getOrCreateCart({ userId, allowCreate: true });
    return this.cartService.buildCartView(cart);
  }

  @ApiOperation({ summary: 'Agregar item al carrito' })
  @Post('items')
  async addItem(@Body() body: AddItemDto, @Req() req: Request) {
    const userId = this.getUserId(req) ?? body.userId; // fallback mientras conectas JWT
    return this.cartService.addItem({ userId, productId: body.productId, quantity: Number(body.quantity) || 1 });
  }

  @ApiOperation({ summary: 'Actualizar cantidad de un item (0 = eliminar)' })
  @Patch('items/:itemId')
  async updateQty(@Param('itemId') itemId: string, @Body() body: UpdateQtyDto, @Req() req: Request) {
    const userId = this.getUserId(req);
    return this.cartService.updateItemQty({ userId, itemId, quantity: Number(body.quantity) || 0 });
  }

  @ApiOperation({ summary: 'Eliminar item del carrito' })
  @Delete('items/:itemId')
  async removeItem(@Param('itemId') itemId: string, @Req() req: Request) {
    const userId = this.getUserId(req);
    return this.cartService.removeItem({ userId, itemId });
  }

  @ApiOperation({ summary: 'Revalidar carrito (precio/stock)' })
  @Post('refresh')
  async refresh(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.cartService.refresh({ userId });
  }

  @ApiOperation({ summary: 'Fusionar carrito de invitado con el del usuario' })
  @Post('merge')
  async merge(@Req() req: Request) {
    const userId = this.getUserId(req);
    if (!userId) {
      // si no hay usuario autenticado, no hay nada que fusionar en el modelo actual
      const cart = await this.cartService.getOrCreateCart({ userId: undefined, allowCreate: true });
      return this.cartService.buildCartView(cart);
    }
    return this.cartService.mergeGuestIntoUser({ userId, guestCartId: null });
  }

  @ApiOperation({ summary: 'Validar carrito antes de checkout' })
  @Post('checkout/validate')
  async validate(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.cartService.validateBeforeCheckout({ userId });
  }
}