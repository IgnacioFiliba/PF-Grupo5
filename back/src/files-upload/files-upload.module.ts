import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FilesUploadController } from './files-upload.controller';
import { FilesUploadService } from './files-upload.service';
import { FilesUploadRepository } from './files-upload.repository';

import { Products } from 'src/products/entities/product.entity';

@Module({
  imports: [
    // Para que FilesUploadService pueda inyectar ProductsRepository
    TypeOrmModule.forFeature([Products]),
  ],
  controllers: [FilesUploadController],
  providers: [FilesUploadService, FilesUploadRepository],
  exports: [
    FilesUploadService,
    FilesUploadRepository, // 👈 exporta el repo para usarlo en otros módulos
  ],
})
export class FilesUploadModule {}