import { Controller, Get, Post, Body } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';

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

  @Post()
  async create(@Body() dto: CreateTestimonialDto) {
    const testimonial = await this.testimonialsService.create(dto);
    return {
      message: 'Testimonial submitted successfully.',
      data: testimonial,
    };
  }
}