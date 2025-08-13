import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
  ManyToOne, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { CartItem } from './cart-item.entity';
import { Users } from '../../users/entities/user.entity';

export type CartStatus = 'ACTIVE' | 'ABANDONED' | 'CONVERTED';

@Entity({ name: 'carts' })
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Users, { nullable: true })
  user?: Users | null;

  @Column({ type: 'varchar', length: 10, default: 'ACTIVE' })
  status: CartStatus;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  // numeric como string para no perder precisión
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastValidatedAt?: Date;

  @OneToMany(() => CartItem, (ci) => ci.cart, { cascade: true })
  items: CartItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}