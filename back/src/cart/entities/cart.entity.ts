import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartItem } from './cart-item.entity';
import { Users } from 'src/users/entities/user.entity';
import { CartStatus } from '../cart.types';

@Entity({ name: 'carts' })
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, default: CartStatus.OPEN })
  status: CartStatus;

  // ✅ The decorator must be immediately followed by a field declaration
  @ManyToOne(() => Users, { nullable: true, eager: true })
  @JoinColumn({ name: 'user_id' })
  user: Users | null;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true, eager: false })
  items: CartItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}