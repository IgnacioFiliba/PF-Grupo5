import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FilesUploadController } from './files-upload.controller';
import { FilesUploadService } from './files-upload.service';
import { FilesUploadRepository } from './files-upload.repository';

@Module({
  imports: [
    MulterModule.register({}), // si configuras multer en otro lado, puedes quitarlo
  ],
  controllers: [FilesUploadController],
  providers: [FilesUploadService, FilesUploadRepository],
  exports: [FilesUploadService, FilesUploadRepository],
})
export class FilesUploadModule {}