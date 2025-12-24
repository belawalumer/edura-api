import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GradeSubjectsService } from './grade-subjects.service';

@Controller('grade-subjects')
export class GradeSubjectsController {
  constructor(private readonly gradeSubjectsService: GradeSubjectsService) {}

  @Get('grade/:gradeId')
  findByGrade(@Param('gradeId', ParseIntPipe) gradeId: number) {
    return this.gradeSubjectsService.findByGrade(gradeId);
  }
}
