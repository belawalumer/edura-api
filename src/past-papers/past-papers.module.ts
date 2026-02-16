import { Module } from '@nestjs/common';
import { PastPapersService } from './past-papers.service';
import { PastPapersController } from './past-papers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PastPaper } from './entities/past-paper.entity';
import { ExamCategory } from '../exam-category/entities/exam-category.entity';
import { UserModule } from '../user/user.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PastPaper, ExamCategory]),
    UserModule,
    CloudinaryModule,
  ],
  controllers: [PastPapersController],
  providers: [PastPapersService],
})
export class PastPapersModule {}
