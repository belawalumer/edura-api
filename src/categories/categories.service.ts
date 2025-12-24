import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/index';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { title } = createCategoryDto;

    const existingCategory = await this.categoryRepo.findOne({
      where: { title },
    });

    if (existingCategory) {
      return {
        message: `Category with title ${title} already exists`,
      };
    }

    const category = this.categoryRepo.create(createCategoryDto);
    const savedCategory = await this.categoryRepo.save(category);
    return {
      message: 'Category created successfully',
      data: savedCategory,
    };
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.categoryRepo
      .createQueryBuilder('category')
      .orderBy('category.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where('category.title ILIKE :search', { search: `%${search}%` });
    }

    qb.orderBy('category.id', 'ASC');

    const [items, total] = await qb.getManyAndCount();

    return {
      message: 'Categories retrieved successfully',
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

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    Object.assign(category, updateCategoryDto);
    const updatedCategory = await this.categoryRepo.save(category);
    return {
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }

  async remove(id: number) {
    const result = await this.categoryRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return { message: 'Category deleted successfully' };
  }
}
