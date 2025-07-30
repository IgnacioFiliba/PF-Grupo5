import { Injectable } from '@nestjs/common';
import { FileUploadRepository } from './file-upload.repository';
import { Products } from 'src/products/entities/product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly fileUploadRepository: FileUploadRepository,
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
  ) {}

  async uploadImage(file: Express.Multer.File, productId: string) {
    const product = await this.productsRepository.findOneBy({ id: productId });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const uploadResponse = await this.fileUploadRepository.uploadImage(file);

    await this.productsRepository.update(product.id, {
      imgUrl: uploadResponse.secure_url,
    });

    return await this.productsRepository.findOneBy({ id: productId });
  }
}
