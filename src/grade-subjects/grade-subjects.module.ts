import { Module } from '@nestjs/common';
import { GradeSubjectsService } from './grade-subjects.service';
import { GradeSubjectsController } from './grade-subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradeSubject } from './entities/grade-subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GradeSubject])],
  controllers: [GradeSubjectsController],
  providers: [GradeSubjectsService],
})
export class GradeSubjectsModule {}
