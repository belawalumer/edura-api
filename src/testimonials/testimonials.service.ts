import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialRepo: Repository<Testimonial>,
  ) {}

  async findAll(): Promise<Testimonial[]> {
    return this.testimonialRepo.find({
      where: { isActive: true },
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: number): Promise<Testimonial | null> {
    return this.testimonialRepo.findOne({ where: { id, isActive: true } });
  }
}