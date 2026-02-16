import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCareerLevelDto } from './dto/create-career-level.dto';
import { CareerLevel } from './entities/career-level.entity';

@Injectable()
export class CareerLevelsService {
  constructor(
    @InjectRepository(CareerLevel)
    private readonly careerLevelRepo: Repository<CareerLevel>
  ) {}

  async create(createCareerLevelDto: CreateCareerLevelDto) {
    const exists = await this.careerLevelRepo
      .createQueryBuilder('level')
      .where('LOWER(level.name) = LOWER(:name)', {
        name: createCareerLevelDto.name,
      })
      .getOne();

    if (exists) {
      throw new ConflictException('Career level already exists');
    }

    const level = this.careerLevelRepo.create(createCareerLevelDto);
    return this.careerLevelRepo.save(level);
  }
}
