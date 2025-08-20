import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { OrderItem } from 'src/orders/entities/order-item.entity';

@Entity('PRODUCTS')
export class Products {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  stock: number;

  @Column({ nullable: true })
  imgUrl: string;

  @Column({ length: 20 })
  year: string;

  @Column({ length: 50 })
  brand: string;

  @Column({ length: 50 })
  model: string;

  @Column({ length: 50 })
  engine: string;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  // 🔹 Ahora se relaciona con OrderItem en vez de OrderDetails directamente
  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems: OrderItem[];
}
