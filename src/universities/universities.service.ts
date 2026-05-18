import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from './entities/university.entity';
import { UniversityMerit } from './entities/university-merit.entity';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { GetUniversitiesQueryDto } from './dto/get-universities-query.dto';

@Injectable()
export class UniversitiesService {
  constructor(
    @InjectRepository(University)
    private readonly universityRepo: Repository<University>
  ) {}

  async create(dto: CreateUniversityDto) {
    const existing = await this.universityRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('University with this name already exists');
    }

    const university = this.universityRepo.create({
      name: dto.name,
      city: dto.city,
      meritList: dto.merits.map((m) =>
        this.universityRepo.manager.create(UniversityMerit, {
          degree: m.degree,
          lastYearClosingMerit: m.lastYearClosingMerit,
        })
      ),
    });

    await this.universityRepo.save(university);
    return this.findOne(university.id);
  }

  async findAll(query: GetUniversitiesQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const qb = this.universityRepo
      .createQueryBuilder('university')
      .leftJoinAndSelect('university.meritList', 'meritList')
      .orderBy('university.name', 'ASC');

    if (search) {
      qb.andWhere('university.name ILIKE :search', { search: `%${search}%` });
    }

    const total = await qb.getCount();
    qb.skip((page - 1) * limit).take(limit);

    const items = await qb.getMany();

    return {
      message: 'Universities fetched successfully',
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
    const university = await this.universityRepo.findOne({
      where: { id },
      relations: ['meritList'],
    });
    if (!university) {
      throw new NotFoundException('University not found');
    }
    return {
      message: 'University fetched successfully',
      data: university,
    };
  }

  async update(id: number, dto: UpdateUniversityDto) {
    const university = await this.universityRepo.findOne({
      where: { id },
      relations: ['meritList'],
    });
    if (!university) {
      throw new NotFoundException('University not found');
    }

    if (dto.name !== undefined) university.name = dto.name;
    if (dto.city !== undefined) university.city = dto.city;

    if (dto.merits !== undefined) {
      await this.universityRepo.manager.delete(UniversityMerit, {
        university: { id },
      });
      university.meritList = dto.merits.map((m) =>
        this.universityRepo.manager.create(UniversityMerit, {
          degree: m.degree,
          lastYearClosingMerit: m.lastYearClosingMerit,
        })
      );
    }

    await this.universityRepo.save(university);
    return this.findOne(id);
  }

  async remove(id: number) {
    const university = await this.universityRepo.findOne({ where: { id } });
    if (!university) {
      throw new NotFoundException('University not found');
    }
    await this.universityRepo.remove(university);
    return { message: 'University deleted successfully' };
  }
}