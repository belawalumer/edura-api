import { Module } from '@nestjs/common';
import { ExamCategoryService } from './exam-category.service';
import { ExamCategoryController } from './exam-category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamCategory } from './entities/exam-category.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([ExamCategory]), UserModule],
  controllers: [ExamCategoryController],
  providers: [ExamCategoryService],
})
export class ExamCategoryModule {}
