import { Controller, Get } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  async findAll() {
    const testimonials = await this.testimonialsService.findAll();
    return {
      message: 'Testimonials retrieved successfully',
      data: testimonials,
    };
  }
}