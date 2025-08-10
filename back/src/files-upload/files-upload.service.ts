import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class FilesUploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadProductImage(productId: string, file: Express.Multer.File) {
    try {
      const uploaded: UploadApiResponse = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'productos',
            public_id: productId, // opcional: usa el id del producto
            overwrite: true,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('Empty Cloudinary response'));
            resolve(result as UploadApiResponse);
          },
        );
        stream.end(file.buffer);
      });

      // Aquí solo devolvemos la info. Si quieres guardar en BD, hazlo en tu ProductsService.
      return {
        productId,
        imageUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
      };
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Error subiendo la imagen: ${err?.message ?? err}`,
      );
    }
  }
}