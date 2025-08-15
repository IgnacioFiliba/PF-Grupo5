import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Users } from 'src/users/entities/user.entity';
import { OrderDetails } from './order-detail.entity';

@Entity({ name: 'ORDERS' })
export class Orders {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column({ default: 'approved' })
  status: string;

  @Column({ name: 'mp_preference_id', nullable: true })
  mpPreferenceId?: string;

  @Column({ name: 'mp_payment_id', nullable: true })
  mpPaymentId?: string;

  @OneToOne(() => OrderDetails, (orderDetails) => orderDetails.order)
  orderDetails: OrderDetails;

  @ManyToOne(() => Users, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
