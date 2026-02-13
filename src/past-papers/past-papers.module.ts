import { Module } from '@nestjs/common';
import { PastPapersService } from './past-papers.service';
import { PastPapersController } from './past-papers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PastPaper } from './entities/past-paper.entity';
import { ExamCategory } from './entities/exam-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PastPaper, ExamCategory])],
  controllers: [PastPapersController],
  providers: [PastPapersService],
})
export class PastPapersModule {}
