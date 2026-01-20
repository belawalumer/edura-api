import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { GradeSubjectsService } from './grade-subjects.service';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';

@UseGuards(AuthGuard)
@Controller('grade-subjects')
export class GradeSubjectsController {
  constructor(private readonly gradeSubjectsService: GradeSubjectsService) {}

  @Get('grade/:gradeId')
  @Roles(UserRole.ADMIN)
  findByGrade(@Param('gradeId', ParseIntPipe) gradeId: number) {
    return this.gradeSubjectsService.findByGrade(gradeId);
  }
}
