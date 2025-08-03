import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
<<<<<<< HEAD
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
=======
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/interceptors/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SearchProductDto } from './dto/search-product.dto';
>>>>>>> 19b9c552db4e83e2df48b2e97b936607fc651a88

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product by id' })
  update(@Param('id') id: string, @Body() dto: SearchProductDto) {
    return this.productsService.update(id, dto);
  }

<<<<<<< HEAD
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by id' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
=======
  @Get('search')
  search(@Query() filters: SearchProductDto) {
    return this.productsService.searchProducts(filters);
  }
}
>>>>>>> 19b9c552db4e83e2df48b2e97b936607fc651a88
