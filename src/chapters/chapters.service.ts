import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Chapter } from './entities/chapter.entity';
import { Repository } from 'typeorm';
import { GradeSubject } from '../grade-subjects/entities/grade-subject.entity';
import { PaginationQueryDto } from 'src/common/dto';

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

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.chapterRepo
      .createQueryBuilder('chapter')
      .leftJoinAndSelect('chapter.gradeSubject', 'gs')
      .leftJoinAndSelect('gs.grade', 'grade')
      .leftJoinAndSelect('gs.subject', 'subject')
      .orderBy('chapter.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('chapter.name ILIKE :search', { search: `%${search}%` });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      message: 'Chapters retrieved successfully',
      data: {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    };
  }

  async findByGradeAndSubject(gradeId: number, subjectId: number) {
    const chapters = await this.chapterRepo
      .createQueryBuilder('chapter')
      .leftJoinAndSelect('chapter.gradeSubject', 'gs')
      .leftJoinAndSelect('gs.grade', 'grade')
      .leftJoinAndSelect('gs.subject', 'subject')
      .where('gs.grade_id = :gradeId', { gradeId })
      .andWhere('gs.subject_id = :subjectId', { subjectId })
      .orderBy('chapter.name', 'ASC')
      .getMany();

    return {
      message: 'Chapters retrieved successfully',
      data: chapters.map((ch) => ({
        id: ch.id,
        name: ch.name,
        status: ch.status,
      })),
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

    const { name, status, gradeId, subjectId } = updateChapterDto;

    //Update grade/subject if provided
    if (gradeId && subjectId) {
      const gradeSubject = await this.gradeSubjectRepo.findOne({
        where: { grade: { id: gradeId }, subject: { id: subjectId } },
        relations: ['grade', 'subject'],
      });

      if (!gradeSubject) {
        throw new NotFoundException(
          'This subject is not assigned to the selected grade',
        );
      }

      chapter.gradeSubject = gradeSubject;
    }

    // Update name/status if provided
    if (name !== undefined) chapter.name = name;
    if (status !== undefined) chapter.status = status;

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
