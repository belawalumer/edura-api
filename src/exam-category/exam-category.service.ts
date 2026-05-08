import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamCategory } from './entities/exam-category.entity';
import { CreateExamCategoryDto } from './dto/create-exam-category.dto';

@Injectable()
export class ExamCategoryService {
  constructor(
    @InjectRepository(ExamCategory)
    private readonly examCategoryRepo: Repository<ExamCategory>
  ) {}

  async findParentCategories(search?: string): Promise<ExamCategory[]> {
    const qb = this.examCategoryRepo
      .createQueryBuilder('category')
      .where('category.parent IS NULL')
      .orderBy('category.name', 'ASC');

    if (search) {
      qb.andWhere('category.name ILIKE :search', { search: `%${search}%` });
    }

    return qb.getMany();
  }

  async findBoards(parentId: number, search?: string): Promise<ExamCategory[]> {
    const qb = this.examCategoryRepo
      .createQueryBuilder('board')
      .where('board.parentId = :parentId', { parentId })
      .orderBy('board.name', 'ASC');

    if (search) {
      qb.andWhere('board.name ILIKE :search', { search: `%${search}%` });
    }

    return qb.getMany();
  }

  async createBoards(
    parentId: number,
    createExamCategoryDto: CreateExamCategoryDto
  ) {
    const parent = await this.examCategoryRepo.findOne({
      where: { id: parentId },
    });
    if (!parent) throw new NotFoundException('Parent category not found');

    const existingBoard = await this.examCategoryRepo
      .createQueryBuilder('board')
      .where('LOWER(board.name) = LOWER(:name)', {
        name: createExamCategoryDto.name,
      })
      .andWhere('board.parentId = :parentId', { parentId })
      .getOne();

    if (existingBoard) {
      throw new ConflictException(
        'Board with this name already exists under this category'
      );
    }

    const child = this.examCategoryRepo.create({
      ...createExamCategoryDto,
      parent,
    });

    return this.examCategoryRepo.save(child);
  }
}
