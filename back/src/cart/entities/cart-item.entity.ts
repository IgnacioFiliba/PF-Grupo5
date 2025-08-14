import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { Cart } from './cart.entity';
import { Products } from 'src/products/entities/product.entity'; // ajusta a Product si tu clase es singular

@Entity({ name: 'cart_items' })
@Unique(['cart', 'product'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cart, (c) => c.items, { onDelete: 'CASCADE' })
  cart: Cart;

  @ManyToOne(() => Products, { eager: true })
  product: Products;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  unitPriceAtAdd: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  unitPriceCurrent: string;

  @Column({ type: 'text', nullable: true })
  productNameSnapshot?: string;

  @Column({ type: 'text', nullable: true })
  imageUrlSnapshot?: string;

  @Column({ type: 'boolean', default: true })
  isValid: boolean;
}