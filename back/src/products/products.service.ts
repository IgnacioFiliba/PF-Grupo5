import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import data from '../seeds/products.json';
import { Categories } from 'src/categories/entities/category.entity';
import { Products } from './entities/product.entity';
import { SearchProductDto } from './dto/search-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    @InjectRepository(Categories)
    private readonly categoriesRepository: Repository<Categories>,
  ) {}

  async seeder() {
    const categories: Categories[] = await this.categoriesRepository.find();

    const newProducts: Products[] = data.map((element) => {
      const category: Categories | undefined = categories.find(
        (category) => element.category === category.name,
      ); // Category{id,name,Products[]}

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

    // Acá podrías usar upsert para insertar o actualizar los productos
    await this.productsRepository.upsert(newProducts, ['name']);
  }

  async getProducts(page: number, limit: number) {
    let products: Products[] = await this.productsRepository.find();

    const start = (page - 1) * limit;
    const end = start + limit;

    products = products.slice(start, end);

    return products;
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
  ) {
    const product = await this.productsRepository.findOneBy({ id });

    if (!product) {
      throw new Error('Product not found');
    }

    Object.assign(product, productData);

    return await this.productsRepository.save(product);
  }

  async searchProducts(filters: SearchProductDto): Promise<Products[]> {
    const query = this.productsRepository.createQueryBuilder('product');

    if (filters.year) {
      query.andWhere('product.year = :year', { year: filters.year });
    }
    if (filters.brand) {
      query.andWhere('product.brand ILIKE :brand', {
        brand: `%${filters.brand}%`,
      });
    }
    if (filters.model) {
      query.andWhere('product.model ILIKE :model', {
        model: `%${filters.model}%`,
      });
    }
    if (filters.engine) {
      query.andWhere('product.engine ILIKE :engine', {
        engine: `%${filters.engine}%`,
      });
    }

    return query.getMany();
  }
}
