import { Module } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chapter } from './entities/chapter.entity';
import { GradeSubject } from 'src/grade-subjects/entities/grade-subject.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, GradeSubject, User])],
  controllers: [ChaptersController],
  providers: [ChaptersService],
})
export class ChaptersModule {}
