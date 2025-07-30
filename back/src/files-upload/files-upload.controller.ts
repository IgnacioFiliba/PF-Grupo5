import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common/pipes';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './files-upload.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('file')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('uploadImage/:productId')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 300000, // 300KB
            message: 'El archivo es demasiado grande. Máximo 300KB.',
          }),
          new FileTypeValidator({
            fileType: /^image\/(jpg|jpeg|png|webp)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,

    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.fileUploadService.uploadImage(file, productId);
  }
}
