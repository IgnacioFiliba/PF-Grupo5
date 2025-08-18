import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiParam, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @ApiBearerAuth()
  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Crear una nueva orden de compra' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener una orden de compra por su ID' })
  @ApiParam({
    name: 'id',
    description: 'ID de la orden a consultar',
    example: '77bd2cdb-9955-4849-abbd-33f064905946',
  })
  findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user.id;
    return this.orderService.findOne(id, userId);
  }
}
