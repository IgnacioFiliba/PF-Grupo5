import { Categories } from 'src/categories/entities/category.entity';
import { OrderDetails } from 'src/orders/entities/order-detail.entity';
import { StockEntry } from 'src/stock-entry/entities/stock-entry.entity';

import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';

@Entity({
  name: 'PRODUCTS',
})
export class Products {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  name: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  price: number; // 99.50

  @Column({
    type: 'int',
    nullable: false,
  })
  stock: number; // 8

  @Column({
    type: 'text',
    default: 'No image',
  })
  imgUrl: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  year: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  brand: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  model: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  engine: string;

  @ManyToOne(() => Categories, (category) => category.products)
  category: Categories;

  @ManyToMany(() => OrderDetails, (orderDetails) => orderDetails.products)
  @JoinTable({
    name: 'ORDER_DETAILS_PRODUCTS',
  })
  orderDetails: OrderDetails[];

  @OneToMany(() => StockEntry, (entry) => entry.product)
  stockEntries: StockEntry[];
}
