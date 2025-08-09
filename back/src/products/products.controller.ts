import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/interceptors/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'Crear un nuevo producto (solo Admin)' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiOperation({ summary: 'Ejecutar seeder de productos (temporal)' })
  @Get('/seeder')
  seeder() {
    return this.productsService.seeder();
  }

  @ApiOperation({ summary: 'Obtener productos paginados con búsqueda parcial' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Cantidad por página',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'bosch',
    description:
      'Texto a buscar (parcial, case-insensitive) en name, brand, model, description, engine y year',
  })
  @Get()
  getProducts(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.productsService.getProducts(pageNumber, limitNumber, search);
  }

  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID del producto',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar producto por ID (solo Admin)' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
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
        summary: 'Ejemplo',
        value: {
          name: 'Mouse inalámbrico gamer',
          description: 'Mouse con RGB y 7 botones',
          price: 29.99,
          stock: 100,
          imgUrl: 'https://example.com/mouse.jpg',
        },
      },
    },
  })
  @Put(':id')
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateProductDto>,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  @ApiOperation({ summary: 'Eliminar producto por ID (solo Admin)' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiParam({
    name: 'id',
    description: 'UUID del producto',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  // prueba de carga de datos en develop
  @ApiOperation({ summary: 'Obtener producto por nombre (coincidencia exacta)' })
  @ApiParam({
    name: 'name',
    description: 'Nombre del producto',
    example: 'Filtro de Aceite Bosch',
  })
  @Get('name/:name')
  findOneByName(@Param('name') name: string) {
    return this.productsService.findOneByName(name);
  }
}