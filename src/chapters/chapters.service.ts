import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Chapter } from './entities/chapter.entity';
import { Repository } from 'typeorm';
import { GradeSubject } from '../grade-subjects/entities/grade-subject.entity';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,

    @InjectRepository(GradeSubject)
    private readonly gradeSubjectRepo: Repository<GradeSubject>,
  ) {}

  async create(createChapterDto: CreateChapterDto) {
    const { name, status, gradeId, subjectId } = createChapterDto;

    const gradeSubject = await this.gradeSubjectRepo.findOne({
      where: {
        grade: { id: gradeId },
        subject: { id: subjectId },
      },
      relations: ['grade', 'subject'],
    });

    if (!gradeSubject)
      throw new NotFoundException(
        'This subject is not assigned to the selected grade',
      );

    const chapter = this.chapterRepo.create({
      name,
      status,
      gradeSubject,
    });

    const savedChapter = await this.chapterRepo.save(chapter);

    return { message: 'Chapter created successfully', data: savedChapter };
  }

  async findAll(gradeId?: number, subjectId?: number) {
    const qb = this.chapterRepo
      .createQueryBuilder('chapter')
      .leftJoinAndSelect('chapter.gradeSubject', 'gs')
      .leftJoinAndSelect('gs.grade', 'grade')
      .leftJoinAndSelect('gs.subject', 'subject');

    if (gradeId) {
      qb.andWhere('grade.id = :gradeId', { gradeId });
    }

    if (subjectId) {
      qb.andWhere('subject.id = : subjectId', { subjectId });
    }

    const chapters = await qb.getMany();

    return {
      message: 'Chapters retrieved successfully',
      data: chapters,
    };
  }

  async findOne(id: number) {
    const chapter = await this.chapterRepo.findOne({
      where: { id },
      relations: ['gradeSubject', 'gradeSubject.grade', 'gradeSubject.subject'],
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    return { message: 'Chapter retrieved successfully', data: chapter };
  }

  async update(id: number, updateChapterDto: UpdateChapterDto) {
    const chapter = await this.chapterRepo.findOne({
      where: { id },
      relations: ['gradeSubject'],
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    Object.assign(chapter, updateChapterDto);
    const updatedChapter = await this.chapterRepo.save(chapter);

    return {
      message: 'Chapter updated successfully',
      data: updatedChapter,
    };
  }

  async remove(id: number) {
    const result = await this.chapterRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    return { message: 'Chapter deleted successfully' };
  }
}
