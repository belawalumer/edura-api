import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqsService {
  constructor(
    @InjectRepository(Faq)
    private readonly faqRepo: Repository<Faq>,
  ) {}

  async create(createDto: CreateFaqDto) {
    const faq = this.faqRepo.create(createDto);
    const saved = await this.faqRepo.save(faq);
    return {
      message: 'FAQ created successfully',
      data: saved,
    };
  }

  async findAll() {
    const items = await this.faqRepo.find({ order: { id: 'ASC' } });
    return {
      message: 'FAQs retrieved successfully',
      data: items,
    };
  }

  async update(id: number, updateDto: UpdateFaqDto) {
    const faq = await this.faqRepo.findOne({ where: { id } });
    if (!faq) throw new NotFoundException(`FAQ with ID ${id} not found`);

    Object.assign(faq, updateDto);
    const updated = await this.faqRepo.save(faq);

    return {
      message: 'FAQ updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const faq = await this.faqRepo.findOne({ where: { id } });
    if (!faq) throw new NotFoundException(`FAQ with ID ${id} not found`);

    await this.faqRepo.remove(faq);

    return { message: 'FAQ deleted successfully' };
  }
}
