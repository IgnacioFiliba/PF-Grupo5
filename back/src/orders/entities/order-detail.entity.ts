import {
  Entity,
  Column,
  JoinColumn,
  OneToOne,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Orders } from './order.entity';
import { Products } from 'src/products/entities/product.entity';

@Entity({ name: 'ORDER_DETAILS' })
export class OrderDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price: number;

  @OneToOne(() => Orders, (order) => order.orderDetails)
  @JoinColumn({ name: 'order_id' })
  order: Orders;

  @ManyToMany(() => Products, (product) => product.orderDetails)
  @JoinTable({
    name: 'ORDER_DETAILS_PRODUCTS',
  })
  products: Products[];
}
