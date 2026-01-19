import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from './entities/grade.entity';
import { GradeSubject } from 'src/grade-subjects/entities/grade-subject.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, GradeSubject, Subject, User])],
  controllers: [GradesController],
  providers: [GradesService],
})
export class GradesModule {}
