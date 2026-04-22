import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from './entities/university.entity';

@Injectable()
export class UniversitiesService {
  constructor(
    @InjectRepository(University)
    private readonly universityRepo: Repository<University>
  ) {}

  async getAll() {
    const items = await this.universityRepo.find({
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
      message: 'Universities fetched successfully',
      data: items,
    };
  }
}
