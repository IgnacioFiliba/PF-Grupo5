import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Cart } from './cart.entity';

@Entity({ name: 'CART_ITEMS' })
@Index(['cartId'])
@Index(['productId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ Aseguramos que la relación jamás sea nula en ORM
  @ManyToOne(() => Cart, (c) => c.items, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  // ⚠️ Se mantiene el mapeo de la columna existente (sin tocar migraciones)
  @Column('uuid', { name: 'cart_id' })
  cartId: string;

  @Column('uuid', { name: 'product_id' })
  productId: string;

  @Column('int')
  quantity: number;

  // Precio visto por el usuario al momento de agregar/actualizar
  @Column('numeric', { precision: 10, scale: 2, name: 'unit_price_snapshot' })
  unitPriceSnapshot: number;
}