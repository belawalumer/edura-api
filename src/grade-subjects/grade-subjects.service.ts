import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradeSubject } from './entities/grade-subject.entity';

@Injectable()
export class GradeSubjectsService {
  constructor(
    @InjectRepository(GradeSubject)
    private readonly gradeSubjectRepo: Repository<GradeSubject>
  ) {}

  async findByGrade(gradeId: number) {
    return this.gradeSubjectRepo.find({
      where: { grade: { id: gradeId } },
      relations: ['subject'],
    });
  }
}
