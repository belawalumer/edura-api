import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from './entities/grade.entity';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { PaginationQueryDto } from '../common/dto';
import { GradeSubject } from 'src/grade-subjects/entities/grade-subject.entity';
import { Subject } from 'src/subjects/entities/subject.entity';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(GradeSubject)
    private readonly gradeSubjectRepo: Repository<GradeSubject>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async create(createGradeDto: CreateGradeDto) {
    const { name, categoryId } = createGradeDto;

    const existingGrade = await this.gradeRepo.findOne({
      where: { name, category: { id: categoryId } },
    });

    if (existingGrade) {
      return {
        message: `Grade with name ${name} already exists in this category`,
      };
    }

    const grade = this.gradeRepo.create({
      ...createGradeDto,
      category: { id: categoryId },
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
      .leftJoinAndSelect('grade.category', 'category')
      .orderBy('grade.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where('grade.name ILIKE :search', { search: `%${search}%` });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      message: 'Grades retrieved successfully',
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

  async findOne(id: number) {
    const grade = await this.gradeRepo.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    return {
      message: 'Grade retrieved successfully',
      data: grade,
    };
  }

  async update(id: number, updateGradeDto: UpdateGradeDto) {
    const grade = await this.gradeRepo.findOne({ where: { id } });
    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    Object.assign(grade, updateGradeDto);
    const updatedGrade = await this.gradeRepo.save(grade);

    // Handle subject assignments if subjectIds are provided
    if (updateGradeDto.subjectIds) {
      const subjects = await this.subjectRepo.findByIds(
        updateGradeDto.subjectIds,
      );

      //Remove old ones not in a new list
      const existingMappings = await this.gradeSubjectRepo.find({
        where: { grade: { id: grade.id } },
        relations: ['subject'],
      });

      for (const mapping of existingMappings) {
        if (!updateGradeDto.subjectIds.includes(mapping.subject.id)) {
          await this.gradeSubjectRepo.remove(mapping);
        }
      }

      // Add new mappings
      for (const subject of subjects) {
        const exists = await this.gradeSubjectRepo.findOne({
          where: { grade: { id: grade.id }, subject: { id: subject.id } },
        });
        if (!exists) {
          const mapping = this.gradeSubjectRepo.create({ grade, subject });
          await this.gradeSubjectRepo.save(mapping);
        }
      }
    }

    return {
      message: 'Grade updated successfully',
      data: updatedGrade,
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
