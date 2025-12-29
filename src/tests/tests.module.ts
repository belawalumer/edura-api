import { Module } from '@nestjs/common';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test } from './entities/test.entity';
import { Question } from './entities/question.entity';
import { Option } from './entities/option.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Chapter } from 'src/chapters/entities/chapter.entity';
import { GradeSubject } from 'src/grade-subjects/entities/grade-subject.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Test,
      Question,
      Option,
      Category,
      Chapter,
      GradeSubject,
    ]),
  ],
  controllers: [TestsController],
  providers: [TestsService],
})
export class TestsModule {}
