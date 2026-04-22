import { Controller, Get, UseGuards } from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(AuthGuard)
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Get()
  @Public()
  async getAll() {
    return this.universitiesService.getAll();
  }
}
