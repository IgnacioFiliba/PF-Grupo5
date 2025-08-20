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
      throw new NotFoundException('User not found');
    }

    // Crear orden base
    const order = this.ordersRepository.create({ user, date: new Date() });
    const newOrder = await this.ordersRepository.save(order);

    // Calcular total y actualizar stock
    let total = 0;

    const productsArray: Products[] = await Promise.all(
      createOrderDto.products.map(async ({ id /*, quantity*/ }) => {
        const product = await this.productsRepository.findOneBy({ id });
        if (!product) {
          throw new NotFoundException(`Product with ID ${id} not found`);
        }
        if (product.stock <= 0) {
          throw new BadRequestException(
            `Product "${product.name}" is out of stock`,
          );
        }

        // TODO: si manejan quantity en DTO, usarla aquí
        total += Number(product.price);
        product.stock -= 1;
        await this.productsRepository.save(product);
        return product;
      }),
    );

    const orderDetails = this.orderDetailsRepository.create({
      order: newOrder,
      price: Number(total.toFixed(2)),
      items: productsArray,
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
          items: true,
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
        products: (order.orderDetails.items ?? []).map((item) => ({
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          price: Number(item.product.price).toFixed(2),
          stock: item.product.stock,
          imgUrl: item.product.imgUrl,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice).toFixed(2),
        })),
      },
    };
  }

  async findAll(user: any) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Only admins can view all orders');
    }

    const orders = await this.ordersRepository.find({
      relations: {
        user: true,
        orderDetails: { items: { product: true } },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      date: order.date,
      status: order.status,
      paymentStatus: order.paymentStatus,
      user: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      },
      orderDetails: {
        id: order.orderDetails.id,
        price: Number(order.orderDetails.price).toFixed(2),
        products: (order.orderDetails.items ?? []).map((item) => ({
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          price: Number(item.product.price).toFixed(2),
          quantity: item.quantity,
        })),
      },
    }));
  }

  async updateStatus(orderId: string, user: any) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Only admins can update order status');
    }

    const order = await this.ordersRepository.findOneBy({ id: orderId });

    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== 'En Preparacion') {
      throw new BadRequestException(
        `Order status must be 'En Preparacion' to approve. Current: ${order.status}`,
      );
    }

    order.status = 'Aprobada';
    await this.ordersRepository.save(order);

    return { message: `Order ${order.id} approved successfully` };
  }

  async getDashboard() {
    const orders = await this.ordersRepository.find({
      relations: {
        orderDetails: { items: { product: true } },
      },
    });

    const productSales = new Map<
      string,
      {
        productId: string;
        productName: string;
        totalQuantity: number;
        totalRevenue: number;
        salesByDate: { date: string; quantity: number }[];
      }
    >();

    for (const order of orders) {
      const orderDate = order.date.toISOString().split('T')[0];

      for (const item of order.orderDetails.items) {
        const key = item.product.id;
        if (!productSales.has(key)) {
          productSales.set(key, {
            productId: item.product.id,
            productName: item.product.name,
            totalQuantity: 0,
            totalRevenue: 0,
            salesByDate: [],
          });
        }

        const salesData = productSales.get(key)!;
        salesData.totalQuantity += item.quantity;
        salesData.totalRevenue += Number(item.unitPrice) * item.quantity;

        const existingDate = salesData.salesByDate.find(
          (s) => s.date === orderDate,
        );
        if (existingDate) {
          existingDate.quantity += item.quantity;
        } else {
          salesData.salesByDate.push({
            date: orderDate,
            quantity: item.quantity,
          });
        }
      }
    }

    const summary = {
      totalOrders: orders.length,
      totalRevenue: Array.from(productSales.values()).reduce(
        (acc, p) => acc + p.totalRevenue,
        0,
      ),
      totalProductsSold: Array.from(productSales.values()).reduce(
        (acc, p) => acc + p.totalQuantity,
        0,
      ),
    };

    return {
      sales: Array.from(productSales.values()),
      summary,
    };
  }
}
