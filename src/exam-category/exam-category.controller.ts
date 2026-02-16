import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ExamCategoryService } from './exam-category.service';
import { CreateExamCategoryDto } from './dto/create-exam-category.dto';
import { AuthGuard } from '../auth/guard/auth_guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('exam-categories')
export class ExamCategoryController {
  constructor(private readonly examCategoryService: ExamCategoryService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  async getParentCategories() {
    return this.examCategoryService.findParentCategories();
  }

  @Get(':parentId/boards')
  @Roles(UserRole.ADMIN, UserRole.USER)
  findBoards(@Param('parentId', ParseIntPipe) parentId: number) {
    return this.examCategoryService.findBoards(parentId);
  }

  @Post(':parentId/boards')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  createBoards(
    @Param('parentId', ParseIntPipe) parentId: number,
    @Body() createExamCategoryDto: CreateExamCategoryDto
  ) {
    return this.examCategoryService.createBoards(
      parentId,
      createExamCategoryDto
    );
  }
}
