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

  async getProducts(page: number, limit: number): Promise<Products[]> {
    const allProducts = await this.productRepository.find({
      relations: ['category'],
    });
    const start = (page - 1) * limit;
    const end = start + limit;
    return allProducts.slice(start, end);
  }

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
