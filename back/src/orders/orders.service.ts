import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from 'src/users/entities/user.entity';
import { Orders } from './entities/order.entity';
import { OrderDetails } from './entities/order-detail.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Products } from 'src/products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Orders)
    private ordersRepository: Repository<Orders>,
    @InjectRepository(OrderDetails)
    private orderDetailsRepository: Repository<OrderDetails>,
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    if (!createOrderDto.userId || !createOrderDto.products?.length) {
      throw new BadRequestException('User ID and products are required');
    }

    const user = await this.usersRepository.findOneBy({
      id: createOrderDto.userId,
    });
    if (!user) {
      throw new NotFoundException(`Incorrect user`);
    }

    if (!user) throw new NotFoundException('User not found');

    const order = this.ordersRepository.create({ user, date: new Date() });
    const newOrder = await this.ordersRepository.save(order);

    let total = 0;

    const productsArray: Products[] = await Promise.all(
      createOrderDto.products.map(async ({ id }) => {
        const product = await this.productsRepository.findOneBy({ id });
        if (!product)
          throw new NotFoundException(`Product with ID ${id} not found`);
        if (product.stock <= 0)
          throw new BadRequestException(
            `Product "${product.name}" is out of stock`,
          );

        total += Number(product.price);
        product.stock -= 1;
        await this.productsRepository.save(product);
        return product;
      }),
    );

    const orderDetails = this.orderDetailsRepository.create({
      order: newOrder,
      price: Number(total.toFixed(2)),
      products: productsArray,
    });

    const savedDetails = await this.orderDetailsRepository.save(orderDetails);

    return {
      id: newOrder.id,
      date: newOrder.date,
      orderDetails: {
        id: savedDetails.id,
        price: savedDetails.price.toFixed(2),
      },
    };
  }

  async findOne(orderId: string, userId: string) {
    if (!orderId) throw new BadRequestException('Order ID is required');

    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: {
        user: true,
        orderDetails: {
          products: true,
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.user.id !== userId) {
      throw new ForbiddenException('You are not allowed to access this order');
    }

    return {
      id: order.id,
      date: order.date,
      orderDetails: {
        id: order.orderDetails.id,
        price: Number(order.orderDetails.price).toFixed(2),
        products: (order.orderDetails.products ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: Number(p.price).toFixed(2),
          stock: p.stock,
          imgUrl: p.imgUrl,
        })),
      },
    };
  }
}
