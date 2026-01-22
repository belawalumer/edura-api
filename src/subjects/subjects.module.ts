import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, User])],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule {}
