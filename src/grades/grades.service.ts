import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from './entities/grade.entity';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { PaginationQueryDto } from '../common/dto';
import { GradeSubject } from 'src/grade-subjects/entities/grade-subject.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Status } from 'src/common/enums';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(GradeSubject)
    private readonly gradeSubjectRepo: Repository<GradeSubject>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>
  ) {}

  async create(createGradeDto: CreateGradeDto) {
    const { name, status } = createGradeDto;

    const existingGrade = await this.gradeRepo.findOne({
      where: { name },
    });

    if (existingGrade) {
      return {
        message: `Grade with name ${name} already exists in this category`,
      };
    }

    const grade = this.gradeRepo.create({
      ...createGradeDto,
      status: status || Status.ACTIVE,
    });

    const savedGrade = await this.gradeRepo.save(grade);
    return {
      message: 'Grade created successfully',
      data: savedGrade,
    };
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.gradeRepo
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.gradeSubjects', 'gradeSubject')
      .leftJoinAndSelect('gradeSubject.subject', 'subject')
      .orderBy('grade.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where('grade.name ILIKE :search', { search: `%${search}%` });
    }

    const [grades, total] = await qb.getManyAndCount();

    return {
      message: 'Grades retrieved successfully',
      data: {
        items: grades.map((grade) => ({
          id: grade.id,
          name: grade.name,
          status: grade.status,
          subjects: grade.gradeSubjects.map((gs) => ({
            id: gs.subject.id,
            name: gs.subject.name,
            status: gs.subject.status,
          })),
        })),
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

  async update(id: number, updateGradeDto: UpdateGradeDto) {
    const grade = await this.gradeRepo.findOne({
      where: { id },
    });

    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    Object.assign(grade, updateGradeDto);
    await this.gradeRepo.save(grade);

    if (updateGradeDto.subjectIds) {
      await this.gradeSubjectRepo.delete({
        grade: { id },
      });

      const subjects = await this.subjectRepo.findByIds(
        updateGradeDto.subjectIds
      );

      const mappings = subjects.map((subject) =>
        this.gradeSubjectRepo.create({
          grade,
          subject,
        })
      );

      await this.gradeSubjectRepo.save(mappings);
    }

    const updatedGrade = await this.gradeRepo.findOne({
      where: { id },
      relations: ['gradeSubjects', 'gradeSubjects.subject'],
    });

    if (!updatedGrade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    return {
      message: 'Grade updated successfully',
      data: {
        id: updatedGrade.id,
        name: updatedGrade.name,
        status: updatedGrade.status,
        subjects: updatedGrade.gradeSubjects.map((gs) => ({
          id: gs.subject.id,
          name: gs.subject.name,
          status: gs.subject.status,
        })),
      },
    };
  }

  async remove(id: number) {
    const result = await this.gradeRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    return { message: 'Grade deleted successfully' };
  }
}
