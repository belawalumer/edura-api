import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ExamCategory } from './entities/exam-category.entity';
import { CreateExamCategoryDto } from './dto/create-exam-category.dto';

@Injectable()
export class ExamCategoryService {
  constructor(
    @InjectRepository(ExamCategory)
    private readonly examCategoryRepo: Repository<ExamCategory>
  ) {}

  async findParentCategories(): Promise<ExamCategory[]> {
    return this.examCategoryRepo.find({
      where: { parent: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async findBoards(parentId: number): Promise<ExamCategory[]> {
    return this.examCategoryRepo.find({
      where: { parent: { id: parentId } },
      order: { name: 'ASC' },
    });
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
