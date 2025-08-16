import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany, Index
} from 'typeorm';
import { CartItem } from './cart-item.entity';

@Entity({ name: 'CARTS' })
@Index(['userId'])
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @OneToMany(() => CartItem, (i) => i.cart, { cascade: true })
  items: CartItem[];

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}