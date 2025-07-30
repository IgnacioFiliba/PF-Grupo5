import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import data from '../seeds/products.json';
import { Categories } from 'src/categories/entities/category.entity';
import { Products } from './entities/product.entity';

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
}
