import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

export function CloudinaryFile(fieldName: string) {
  return FileInterceptor(fieldName, {
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        return cb(
          new BadRequestException('Only image files are allowed'),
          false
        );
      }
      cb(null, true);
    },
  });
}
