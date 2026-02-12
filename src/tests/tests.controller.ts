import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { PaginationQueryDto } from 'src/common/dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { StartTestDto } from './dto/start-test-dto';
import { SubmitTestDto } from './dto/submit-test-dto';
import type { RequestWithUser } from 'src/auth/guard/auth_guard';
import {
  CategoryType,
  EntryType,
  TestStatus,
  UserRole,
} from 'src/common/enums';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('academic_tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  create(@Body() createTestDto: CreateTestDto) {
    return this.testsService.create(createTestDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: PaginationQueryDto) {
    return this.testsService.findAll(query);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.testsService.remove(id);
  }

  @Get('available')
  @Roles(UserRole.USER)
  async getAvailableTests(
    @Query('type') type: CategoryType,
    @Query('gradeId', ParseIntPipe) gradeId?: number,
    @Query('entryType') entryType?: EntryType
  ) {
    return this.testsService.getSubjectsForGrade({ type, gradeId, entryType });
  }

  @Get('grade-subject')
  @Roles(UserRole.USER)
  async getAllTestsByGradeAndSubject(
    @Query('gradeId', ParseIntPipe) gradeId: number,
    @Query('subjectId', ParseIntPipe) subjectId: number,
    @Query('filter') filter?: TestStatus
  ) {
    return this.testsService.getAllTestsByGradeAndSubject(
      gradeId,
      subjectId,
      filter
    );
  }

  @Get(':id')
  @Roles(UserRole.USER)
  async getTestById(
    @Param('id', ParseIntPipe) testId: number,
    @Req() req: RequestWithUser
  ) {
    const userId = req.user?.id;
    return this.testsService.getTestById(testId, userId);
  }

  @Post('start')
  @Roles(UserRole.USER)
  async startTest(
    @Req() req: RequestWithUser,
    @Body() dto: StartTestDto,
    @Query() pagination: PaginationQueryDto
  ) {
    const { page = 1, limit = 10 } = pagination;
    return this.testsService.startTest(req.user!.id!, dto.test_id, page, limit);
  }

  @Post('progress')
  @Roles(UserRole.USER)
  saveProgress(@Req() req: RequestWithUser, @Body() dto: SubmitTestDto) {
    return this.testsService.saveTestProgress(
      req.user!.id!,
      dto.test_attempt_id,
      dto.remaining_duration,
      dto.answers
    );
  }

  @Post('submit')
  @Roles(UserRole.USER)
  submitTest(@Req() req: RequestWithUser, @Body() dto: SubmitTestDto) {
    return this.testsService.submitTest(
      req.user!.id!,
      dto.test_attempt_id,
      dto.remaining_duration,
      dto.answers
    );
  }
}
