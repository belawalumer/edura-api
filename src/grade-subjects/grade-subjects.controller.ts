import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { GradeSubjectsService } from './grade-subjects.service';
import { AuthGuard } from 'src/auth/guard/auth_guard';

@UseGuards(AuthGuard)
@Controller('grade-subjects')
export class GradeSubjectsController {
  constructor(private readonly gradeSubjectsService: GradeSubjectsService) {}

  @Get('grade/:gradeId')
  findByGrade(@Param('gradeId', ParseIntPipe) gradeId: number) {
    return this.gradeSubjectsService.findByGrade(gradeId);
  }
}
