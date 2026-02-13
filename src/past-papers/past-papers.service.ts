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

@Injectable()
export class PastPapersService {
  constructor(
    @InjectRepository(PastPaper) private readonly repo: Repository<PastPaper>
  ) {}

  async create(dto: CreatePastPaperDto) {
    const exists = await this.repo.findOne({
      where: {
        category: { id: dto.category_id },
        grade: { id: dto.grade_id },
        subject: { id: dto.subject_id },
        year: dto.year,
      },
      relations: ['category', 'grade', 'subject'],
    });

    if (exists) {
      throw new ConflictException('Duplicate past paper');
    }

    const paper = this.repo.create({
      category: { id: dto.category_id },
      grade: { id: dto.grade_id },
      subject: { id: dto.subject_id },
      year: dto.year,
      file_url: dto.file_url,
      status: dto.status ?? Status.ACTIVE,
    });

    const savedPaper = await this.repo.save(paper);

    return {
      message: 'Past paper created successfully',
      data: savedPaper,
    };
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.repo
      .createQueryBuilder('paper')
      .leftJoinAndSelect('paper.category', 'category')
      .leftJoinAndSelect('paper.grade', 'grade')
      .leftJoinAndSelect('paper.subject', 'subject')
      .orderBy('paper.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('paper.file_url ILIKE :search', { search: `%${search}%` });
    }

    const [papers, total] = await qb.getManyAndCount();

    const items = papers.map((paper) => ({
      id: paper.id,
      category: paper.category,
      grade: paper.grade,
      subject: paper.subject,
      year: paper.year,
      file_url: paper.file_url,
      status: paper.status,
      created_at: paper.created_at,
      updated_at: paper.updated_at,
    }));

    return {
      message: 'Past papers retrieved successfully',
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

  async update(id: number, dto: UpdatePastPaperDto) {
    const paper = await this.repo.findOne({ where: { id } });
    if (!paper) throw new NotFoundException('Past paper not found');

    Object.assign(paper, dto);
    return this.repo.save(paper);
  }

  async remove(id: number) {
    const paper = await this.repo.findOne({ where: { id } });
    if (!paper) throw new NotFoundException('Past paper not found');

    await this.repo.remove(paper);

    return { message: 'Past paper deleted permanently' };
  }
}
