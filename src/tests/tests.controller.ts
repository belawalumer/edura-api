import {
  BadRequestException,
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
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { StartTestDto } from './dto/start-test-dto';
import { SubmitTestDto } from './dto/submit-test-dto';
import type { RequestWithUser } from 'src/auth/guard/auth_guard';
import { CategoryType, UserRole } from 'src/common/enums';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import {
  AvailableTestsQueryDto,
  SelectableTestsQueryDto,
} from './dto/get-available-test-dto';

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
  @ApiExcludeEndpoint()
  findAll(@Query() query: PaginationQueryDto) {
    return this.testsService.findAll(query);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.testsService.remove(id);
  }

  @Get('available/select')
  @Public()
  async getSelectableTests(
    @Query() query: SelectableTestsQueryDto,
    @Req() req: RequestWithUser
  ) {
    const { type, subjectId, gradeId, testId, entryType } = query;
    const parsedSubjectId =
      subjectId != null && subjectId !== ''
        ? parseInt(String(subjectId), 10)
        : undefined;
    const parsedGradeId =
      gradeId != null && gradeId !== ''
        ? parseInt(String(gradeId), 10)
        : undefined;
    const parsedTestId =
      testId != null && testId !== ''
        ? parseInt(String(testId), 10)
        : undefined;

    if (type === CategoryType.SUBJECT_TEST) {
      if (parsedSubjectId == null) {
        throw new BadRequestException(
          'subjectId query parameter is required when type is subject',
        );
      }
      if (parsedSubjectId != null && Number.isNaN(parsedSubjectId)) {
        throw new BadRequestException('subjectId must be a valid number');
      }
      if (parsedGradeId == null || Number.isNaN(parsedGradeId)) {
        throw new BadRequestException('gradeId must be a valid number');
      }
    }
    if (type === CategoryType.ENTRY_TEST) {
      if (!entryType && parsedTestId == null) {
        throw new BadRequestException(
          'entryType or testId query parameter is required when type is entry',
        );
      }
      if (parsedTestId != null && Number.isNaN(parsedTestId)) {
        throw new BadRequestException('testId must be a valid number');
      }
    }

    const userId = req.user?.id;
    return this.testsService.getSelectableTests(
      {
        type,
        subjectId: parsedSubjectId,
        gradeId: parsedGradeId,
        testId: parsedTestId,
        entryType,
      },
      userId,
    );
  }

  @Get('available')
  @Public()
  async getAvailableTests(
    @Query() query: AvailableTestsQueryDto,
    @Req() req: RequestWithUser
  ) {
    const { type, gradeId, entryType } = query;

    const parsedGradeId =
      gradeId != null && gradeId !== ''
        ? parseInt(String(gradeId), 10)
        : undefined;

    if (
      parsedGradeId !== undefined &&
      Number.isNaN(parsedGradeId)
    ) {
      throw new BadRequestException('gradeId must be a valid number');
    }

    const userId = req.user?.id;
    return this.testsService.getAvailableTests(
      { type, gradeId: parsedGradeId, entryType },
      query,
      userId
    );
  }

  @Get(':id')
  @Public()
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
    return this.testsService.startTest(req.user?.id!, dto.test_id, page, limit);
  }

  @Post('progress')
  @Roles(UserRole.USER)
  saveProgress(@Req() req: RequestWithUser, @Body() dto: SubmitTestDto) {
    return this.testsService.saveTestProgress(
      req.user!.id!,
      dto.test_attempt_id,
      dto.answers
    );
  }

  @Post('submit')
  @Roles(UserRole.USER)
  submitTest(@Req() req: RequestWithUser, @Body() dto: SubmitTestDto) {
    return this.testsService.submitTest(
      req.user?.id!,
      dto.test_attempt_id,
      dto.answers
    );
  }
}
