import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Products } from './entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import data from '../seeds/products.json';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private readonly productRepository: Repository<Products>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateProductDto): Promise<Products> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    const product = this.productRepository.create({ ...dto, category });
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Products[]> {
    return this.productRepository.find({ relations: ['category'] });
  }

  async findOne(id: string): Promise<Products> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async update(id: string, dto: SearchProductDto): Promise<Products> {
    const product = await this.findOne(id);
    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
      product.category = category;
    }
    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async seeder() {
    const categories = await this.categoryRepository.find();

    const newProducts = data.map((element) => {
      const category = categories.find((cat) => element.category === cat.name);

      const newProduct = new Products();
      newProduct.name = element.name;
      newProduct.description = element.description;
      newProduct.price = element.price;
      newProduct.imgUrl = element.imgUrl ?? '';
      newProduct.stock = element.stock;
      newProduct.category = category!;
      newProduct.year = element.year;
      newProduct.brand = element.brand;
      newProduct.model = element.model;
      newProduct.engine = element.engine;
      return newProduct;
    });

    await this.productRepository.upsert(newProducts, ['name']);
  }

  // MOD: Cambiamos la firma para aceptar 'search' y reemplazamos el find()+slice
  // por un QueryBuilder que hace búsqueda parcial (ILIKE) y paginación en DB.
  async getProducts(
    page: number,
    limit: number,
    search?: string,
  ): Promise<Products[]> {
    const qb = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c');

    // Búsqueda parcial y case-insensitive en varios campos si viene 'search'
    if (search && search.trim().length > 0) {
      qb.where(
        `p.name ILIKE :term
         OR p.brand ILIKE :term
         OR p.model ILIKE :term
         OR p.description ILIKE :term
         OR p.engine ILIKE :term
         OR p.year ILIKE :term`,
        { term: `%${search.trim()}%` },
      );
    }

    // Paginación hecha por la base de datos
    qb.skip((page - 1) * limit).take(limit);

    return qb.getMany();
  }
  // END MOD

  async updateProduct(
    id: string,
    productData: Partial<{
      name: string;
      description: string;
      price: number;
      stock: number;
      imgUrl: string;
    }>,
  ): Promise<Products> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    Object.assign(product, productData);
    return this.productRepository.save(product);
  }

  async findOneByName(name: string): Promise<Products> {
    const product = await this.productRepository.findOne({
      where: { name },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException(`Product "${name}" not found`);
    return product;
  }
}
