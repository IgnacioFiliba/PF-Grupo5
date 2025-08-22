import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Products } from './entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { FilesUploadRepository } from 'src/files-upload/files-upload.repository';
import { SearchProductDto } from './dto/search-product.dto';
import { FindProductsQuery } from './dto/find-products.query'; // <-- NUEVO
import data from '../seeds/products.json';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private readonly productRepository: Repository<Products>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly fileUploadRepository: FilesUploadRepository,
  ) {}

  async create(
    dto: CreateProductDto,
    file?: Express.Multer.File,
  ): Promise<Products> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    let imgUrl = '';
    if (file) {
      const uploadResponse = await this.fileUploadRepository.uploadImage(file);
      imgUrl = uploadResponse.secure_url;
    }

    const product = this.productRepository.create({
      ...dto,
      imgUrl,
      category,
    });

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

  // MOD: búsqueda parcial (ILIKE) + paginación, sin romper el front
  async getProducts(
    page: number,
    limit: number,
    search?: string,
  ): Promise<Products[]> {
    const qb = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c');

    // Si hay término, filtra por varios campos (incluye category y year casteado)
    const term = (search ?? '').trim();
    if (term.length > 0) {
      qb.where(
        `
          p.name ILIKE :term
          OR p.brand ILIKE :term
          OR p.model ILIKE :term
          OR p.description ILIKE :term
          OR p.engine ILIKE :term
          OR c.name ILIKE :term
          OR CAST(p.year AS TEXT) ILIKE :term
        `,
        { term: `%${term}%` },
      );
    }

    // Paginación en DB (mismo contrato de retorno: array de productos)
    qb.skip((page - 1) * limit).take(limit);

    // Nota: no imponemos un orderBy para no cambiar el comportamiento del front
    return qb.getMany();
  }
  // END MOD

  // NUEVO: unifica search + filtros + paginación (respuesta con meta)
  async findAllWithFilters(q: FindProductsQuery): Promise<{
    items: Products[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      brands,
      inStock,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      page = 1,
      limit = 12,
    } = q;

    const qb = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .orderBy('p.name', 'ASC');

    // SEARCH: parcial + case-insensitive en varios campos (incluye categoría y año)
    const term = (search ?? '').trim();
    if (term.length > 0) {
      qb.andWhere(
        `(
          p.name ILIKE :s OR
          p.brand ILIKE :s OR
          p.model ILIKE :s OR
          p.description ILIKE :s OR
          p.engine ILIKE :s OR
          c.name ILIKE :s OR
          CAST(p.year AS TEXT) ILIKE :s
        )`,
        { s: `%${term}%` },
      );
    }

    // BRANDS
    if (brands && brands.length > 0) {
      qb.andWhere('p.brand IN (:...brands)', { brands });
    }

    // STOCK
    if (inStock === 'true') qb.andWhere('p.stock > 0');
    if (inStock === 'false') qb.andWhere('p.stock <= 0');

    // RANGO AÑO
    if (yearMin !== undefined)
      qb.andWhere('p.year >= :ymin', { ymin: yearMin });
    if (yearMax !== undefined)
      qb.andWhere('p.year <= :ymax', { ymax: yearMax });

    // RANGO PRECIO
    if (priceMin !== undefined)
      qb.andWhere('p.price >= :pmin', { pmin: priceMin });
    if (priceMax !== undefined)
      qb.andWhere('p.price <= :pmax', { pmax: priceMax });

    // Paginación
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
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
