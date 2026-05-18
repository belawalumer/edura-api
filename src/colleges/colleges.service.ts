import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { College } from './entities/college.entity';
import { CollegeMerit } from './entities/college-merit.entity';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { GetCollegesQueryDto } from './dto/get-colleges-query.dto';

@Injectable()
export class CollegesService {
  constructor(
    @InjectRepository(College)
    private readonly collegeRepo: Repository<College>
  ) {}

  async create(dto: CreateCollegeDto) {
    const existing = await this.collegeRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('College with this name already exists');
    }

    const college = this.collegeRepo.create({
      name: dto.name,
      city: dto.city,
      meritList: dto.merits.map((m) =>
        this.collegeRepo.manager.create(CollegeMerit, {
          degree: m.degree,
          lastYearClosingMerit: m.lastYearClosingMerit,
        })
      ),
    });

    await this.collegeRepo.save(college);
    return this.findOne(college.id);
  }

  async findAll(query: GetCollegesQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const qb = this.collegeRepo
      .createQueryBuilder('college')
      .leftJoinAndSelect('college.meritList', 'meritList')
      .orderBy('college.name', 'ASC');

    if (search) {
      qb.andWhere('college.name ILIKE :search', { search: `%${search}%` });
    }

    const total = await qb.getCount();
    qb.skip((page - 1) * limit).take(limit);

    const items = await qb.getMany();

    return {
      message: 'Colleges fetched successfully',
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
    const college = await this.collegeRepo.findOne({
      where: { id },
      relations: ['meritList'],
    });
    if (!college) {
      throw new NotFoundException('College not found');
    }
    return {
      message: 'College fetched successfully',
      data: college,
    };
  }

  async update(id: number, dto: UpdateCollegeDto) {
    const college = await this.collegeRepo.findOne({
      where: { id },
      relations: ['meritList'],
    });
    if (!college) {
      throw new NotFoundException('College not found');
    }

    if (dto.name !== undefined) college.name = dto.name;
    if (dto.city !== undefined) college.city = dto.city;

    if (dto.merits !== undefined) {
      await this.collegeRepo.manager.delete(CollegeMerit, {
        college: { id },
      });
      college.meritList = dto.merits.map((m) =>
        this.collegeRepo.manager.create(CollegeMerit, {
          degree: m.degree,
          lastYearClosingMerit: m.lastYearClosingMerit,
        })
      );
    }

    await this.collegeRepo.save(college);
    return this.findOne(id);
  }

  async remove(id: number) {
    const college = await this.collegeRepo.findOne({ where: { id } });
    if (!college) {
      throw new NotFoundException('College not found');
    }
    await this.collegeRepo.remove(college);
    return { message: 'College deleted successfully' };
  }
}