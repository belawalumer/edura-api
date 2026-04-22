import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PastPaper } from './entities/past-paper.entity';
import { CreatePastPaperDto } from './dto/create-past-paper.dto';
import { UpdatePastPaperDto } from './dto/update-past-paper.dto';
import { PaginationQueryDto } from 'src/common/dto';
import { Status } from 'src/common/enums';
import { ExamCategory } from '../exam-category/entities/exam-category.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { PublicPastPapersQueryDto } from './dto/public-past-papers-query.dto';

@Injectable()
export class PastPapersService {
  constructor(
    @InjectRepository(PastPaper) private readonly repo: Repository<PastPaper>,
    @InjectRepository(ExamCategory)
    private readonly categoryRepo: Repository<ExamCategory>
  ) {}

  async create(dto: CreatePastPaperDto) {
    const exists = await this.repo.findOne({
      where: {
        category: { id: dto.category_id },
        board: dto.board_id ? { id: dto.board_id } : undefined,
        grade: dto.grade_id ? { id: dto.grade_id } : undefined,
        subject: dto.subject_id ? { id: dto.subject_id } : undefined,
        year: dto.year,
      },
    });

    if (exists) {
      throw new ConflictException('Duplicate past paper');
    }

    const paper = this.repo.create({
      category: { id: dto.category_id },
      board: dto.board_id ? { id: dto.board_id } : undefined,
      grade: dto.grade_id ? { id: dto.grade_id } : undefined,
      subject: dto.subject_id ? { id: dto.subject_id } : undefined,
      year: dto.year,
      file: dto.file,
      status: dto.status ?? Status.ACTIVE,
    });

    const savedPaper = await this.repo.save(paper);

    const responseData = {
      id: savedPaper.id,
      category_id: savedPaper.category.id,
      board_id: savedPaper.board?.id ?? undefined,
      grade_id: savedPaper.grade?.id ?? undefined,
      subject_id: savedPaper.subject?.id ?? undefined,
      year: savedPaper.year,
      file: savedPaper.file,
      status: savedPaper.status,
      created_at: savedPaper.created_at,
      updated_at: savedPaper.updated_at,
    };

    return {
      message: 'Past paper created successfully',
      data: responseData,
    };
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.repo
      .createQueryBuilder('paper')
      .leftJoinAndSelect('paper.category', 'category')
      .leftJoinAndSelect('paper.board', 'board')
      .leftJoinAndSelect('paper.grade', 'grade')
      .leftJoinAndSelect('paper.subject', 'subject')
      .orderBy('paper.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(category.name ILIKE :search OR board.name ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [papers, total] = await qb.getManyAndCount();

    return {
      message: 'Past papers retrieved successfully',
      data: {
        items: papers,
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

  async findPublic(query: PublicPastPapersQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.repo
      .createQueryBuilder('paper')
      .leftJoinAndSelect('paper.category', 'category')
      .leftJoinAndSelect('paper.board', 'board')
      .leftJoinAndSelect('paper.grade', 'grade')
      .leftJoinAndSelect('paper.subject', 'subject')
      .where('paper.status = :status', { status: Status.ACTIVE })
      .orderBy('paper.year', 'DESC')
      .addOrderBy('paper.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.grade_id != null) {
      qb.andWhere('grade.id = :gradeId', { gradeId: query.grade_id });
    }
    if (query.subject_id != null) {
      qb.andWhere('subject.id = :subjectId', { subjectId: query.subject_id });
    }
    if (query.board_id != null) {
      qb.andWhere('board.id = :boardId', { boardId: query.board_id });
    }
    if (query.category_id != null) {
      qb.andWhere('category.id = :categoryId', { categoryId: query.category_id });
    }
    if (query.year != null) {
      qb.andWhere('paper.year = :year', { year: query.year });
    }
    if (search) {
      qb.andWhere(
        '(category.name ILIKE :search OR board.name ILIKE :search OR subject.name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [papers, total] = await qb.getManyAndCount();

    return {
      message: 'Past papers retrieved successfully',
      data: {
        items: papers,
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
    const paper = await this.repo.findOne({
      where: { id },
      relations: ['category', 'board', 'grade', 'subject'],
    });

    if (!paper) {
      throw new NotFoundException('Past paper not found');
    }

    return {
      message: 'Past paper retrieved successfully',
      data: paper,
    };
  }

  async findPublicOne(id: number) {
    const paper = await this.repo.findOne({
      where: { id, status: Status.ACTIVE },
      relations: ['category', 'board', 'grade', 'subject'],
    });

    if (!paper) {
      throw new NotFoundException('Past paper not found');
    }

    return {
      message: 'Past paper retrieved successfully',
      data: paper,
    };
  }

  async update(id: number, dto: UpdatePastPaperDto) {
    const paper = await this.repo.findOne({ where: { id } });
    if (!paper) throw new NotFoundException('Past paper not found');

    if (dto.category_id) {
      const category = await this.repo.manager.findOne(ExamCategory, {
        where: { id: dto.category_id },
      });
      if (!category) throw new NotFoundException('Category not found');
      paper.category = category;
    }

    if (dto.board_id) {
      const board = await this.repo.manager.findOne(ExamCategory, {
        where: { id: dto.board_id },
      });
      if (!board) throw new NotFoundException('Board not found');
      paper.board = board;
    }

    if (dto.grade_id) {
      const grade = await this.repo.manager.findOne(Grade, {
        where: { id: dto.grade_id },
      });
      if (!grade) throw new NotFoundException('Grade not found');
      paper.grade = grade;
    }

    if (dto.subject_id) {
      const subject = await this.repo.manager.findOne(Subject, {
        where: { id: dto.subject_id },
      });
      if (!subject) throw new NotFoundException('Subject not found');
      paper.subject = subject;
    }

    if (dto.year) paper.year = dto.year;
    if (dto.file) paper.file = dto.file;
    if (dto.status) paper.status = dto.status;

    const updated = await this.repo.save(paper);

    return {
      message: 'Past paper updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const paper = await this.repo.findOne({ where: { id } });
    if (!paper) throw new NotFoundException('Past paper not found');

    await this.repo.remove(paper);

    return { message: 'Past paper deleted permanently' };
  }
}
