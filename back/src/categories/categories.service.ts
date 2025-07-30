import { Injectable } from '@nestjs/common';
import data from '../seeds/products.json';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categories } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Categories)
    private readonly categoriesRepository: Repository<Categories>,
  ) {}

  async seeder() {
    const categoriesNames = new Set(data.map((product) => product.category));

    const categoriesArray = Array.from(categoriesNames);

    const categories = categoriesArray.map((category) => ({ name: category }));

    await this.categoriesRepository.upsert(categories, ['name']);

    return 'Categories Added';
  }
}
