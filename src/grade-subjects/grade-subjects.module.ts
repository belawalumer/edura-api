import { Module } from '@nestjs/common';
import { GradeSubjectsService } from './grade-subjects.service';
import { GradeSubjectsController } from './grade-subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradeSubject } from './entities/grade-subject.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GradeSubject, User])],
  controllers: [GradeSubjectsController],
  providers: [GradeSubjectsService],
})
export class GradeSubjectsModule {}
