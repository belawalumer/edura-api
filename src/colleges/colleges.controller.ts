import { Controller, Get, UseGuards } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(AuthGuard)
@Controller('colleges')
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  @Get()
  @Public()
  async getAll() {
    return this.collegesService.getAll();
  }
}
