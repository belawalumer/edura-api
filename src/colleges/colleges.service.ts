import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { College } from './entities/college.entity';

@Injectable()
export class CollegesService {
  constructor(
    @InjectRepository(College)
    private readonly collegeRepo: Repository<College>
  ) {}

  async getAll() {
    const items = await this.collegeRepo.find({
      relations: ['meritList'],
      order: {
        city: 'ASC',
        name: 'ASC',
        meritList: {
          degree: 'ASC',
        },
      },
    });

    return {
      message: 'Colleges fetched successfully',
      data: items,
    };
  }
}
