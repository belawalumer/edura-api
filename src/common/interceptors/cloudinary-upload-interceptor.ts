import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

type UploadType = 'image' | 'raw';

export function CloudinaryFile(fieldName: string, type: UploadType = 'image') {
  return FileInterceptor(fieldName, {
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (type === 'image') {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false
          );
        }
      } else if (type === 'raw') {
        if (
          !file.mimetype.match(
            /^(application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|application\/vnd.ms-excel|application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet|text\/plain)$/
          )
        ) {
          return cb(
            new BadRequestException(
              'Only document files (PDF, Word, Excel, TXT) are allowed'
            ),
            false
          );
        }
      }
      cb(null, true);
    },
  });
}
