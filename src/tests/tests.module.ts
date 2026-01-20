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
import { User } from 'src/user/entities/user.entity';
import { TestAttempt } from './entities/test_attempt.entity';
import { UserAnswer } from './entities/user_answers.entity';
import { AttemptedQuestion } from './entities/attempted_questions.entity';
import { Grade } from 'src/grades/entities/grade.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Test,
      Question,
      Option,
      Category,
      Chapter,
      GradeSubject,
      User,
      Grade,
      TestAttempt,
      UserAnswer,
      AttemptedQuestion,
    ]),
  ],
  controllers: [TestsController],
  providers: [TestsService],
})
export class TestsModule {}
