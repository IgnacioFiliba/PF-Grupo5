import {
  Controller,
  Get,
  Query,
  UseGuards,
  Put,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
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

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'Ejecuta el seeder de productos (temporal)' })
  @Get('/seeder')
  seeder() {
    return this.productsService.seeder();
  }

  @ApiOperation({ summary: 'Obtener productos paginados' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 3,
    description: 'Cantidad de productos por página',
  })
  @Get()
  getProducts(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 3;

    return this.productsService.getProducts(pageNumber, limitNumber);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar producto por ID (solo Admin)' })
  @ApiParam({
    name: 'id',
    description: 'UUID del producto a actualizar',
    example: '92b50dd3-ab7b-453d-9403-e76e479075e7',
  })
  @ApiBody({
    description: 'Datos a actualizar del producto',
    required: true,
    examples: {
      ejemploActualizacion: {
        summary: 'Ejemplo de actualización',
        value: {
          name: 'Auriculares Inalámbricos Noise Cancelling',
          description: 'Auriculares Bluetooth con cancelación activa de ruido',
          price: 19.99,
          stock: 20,
          imgUrl: 'https://example.com/image.jpg',
        },
      },
    },
  })
  @Put(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    productData: Partial<{
      name: string;
      description: string;
      price: number;
      stock: number;
      imgUrl: string;
    }>,
  ) {
    return this.productsService.updateProduct(id, productData);
  }

  @Get('search')
  search(@Query() filters: SearchProductDto) {
    return this.productsService.searchProducts(filters);
  }
}
