import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Industry } from './entities/industry.entity';
import { CreateIndustryDto } from './dto/create-industry.dto';

@Injectable()
export class IndustriesService {
  constructor(
    @InjectRepository(Industry)
    private readonly industryRepo: Repository<Industry>
  ) {}

  async create(createIndustryDto: CreateIndustryDto) {
    const exists = await this.industryRepo
      .createQueryBuilder('industry')
      .where('LOWER(industry.name) = LOWER(:name)', {
        name: createIndustryDto.name,
      })
      .getOne();

    if (exists) {
      throw new ConflictException('Industry already exists');
    }

    const industry = this.industryRepo.create(createIndustryDto);
    return this.industryRepo.save(industry);
  }
}
