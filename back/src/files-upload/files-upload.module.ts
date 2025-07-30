import { Module } from '@nestjs/common';
import { FileUploadRepository } from './file-upload.repository';
import { FileUploadController } from './files-upload.controller';
import { FileUploadService } from './files-upload.service';
import { cloudinaryConfig } from 'config/cloudinary';
import { Products } from 'src/products/entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Products])],
  controllers: [FileUploadController],
  providers: [FileUploadService, cloudinaryConfig, FileUploadRepository],
})
export class FileUploadModule {}
