import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Unique } from 'typeorm';
import { Cart } from './cart.entity';
import { Products } from 'src/products/entities/product.entity';

@Entity('cart_items')
@Unique(['cart', 'product'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cart, (c) => c.items, { onDelete: 'CASCADE' })
  cart: Cart;

  @ManyToOne(() => Products, { eager: true })
  product: Products;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  // snapshot del precio en el momento de agregar
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, default: 0 })
unitPrice: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lineTotal: string;
}