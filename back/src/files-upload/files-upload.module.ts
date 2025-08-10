import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FilesUploadController } from './files-upload.controller';
import { FilesUploadService } from './files-upload.service';

@Module({
  imports: [
    // memoria por defecto; si ya configuras multer en otro lado, puedes quitarlo
    MulterModule.register({}),
  ],
  controllers: [FilesUploadController],
  providers: [FilesUploadService],
  exports: [FilesUploadService],
})
export class FilesUploadModule {}