import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { PaginationQueryDto } from '../common/dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async create(createDto: CreateSubjectDto) {
    const { name } = createDto;

    let subject = await this.subjectRepo.findOne({ where: { name } });
    if (subject) {
      return { message: `Subject already exists` };
    }

    subject = this.subjectRepo.create({ name });
    const savedSubject = await this.subjectRepo.save(subject);

    return { message: 'Subject created successfully', data: savedSubject };
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.subjectRepo
      .createQueryBuilder('subject')
      .orderBy('subject.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where('subject.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      message: 'Subjects retrieved successfully',
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
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject)
      throw new NotFoundException(`Subject with ID ${id} not found`);

    return { message: 'Subject retrieved successfully', data: subject };
  }

  async update(id: number, updateDto: UpdateSubjectDto) {
    const subject = await this.subjectRepo.findOne({ where: { id } });

    if (!subject)
      throw new NotFoundException(`Subject with ID ${id} not found`);

    Object.assign(subject, updateDto);
    const updatedSubject = await this.subjectRepo.save(subject);

    return { message: 'Subject updated successfully', data: updatedSubject };
  }

  async remove(id: number) {
    const result = await this.subjectRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    return { message: 'Subject deleted successfully' };
  }
}
