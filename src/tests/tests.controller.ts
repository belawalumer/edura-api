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
import { AuthGuard, AuthUser } from 'src/auth/guard/auth_guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { StartTestDto } from './dto/start-test-dto';
import { SubmitTestDto } from './dto/submit-test-dto';

interface RequestWithUser extends Request {
  user?: AuthUser;
}

@UseGuards(AuthGuard)
@Controller('academic_tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post()
  @Roles('admin')
  create(@Body() createTestDto: CreateTestDto) {
    return this.testsService.create(createTestDto);
  }

  @Get()
  @Roles('admin')
  findAll(@Query() query: PaginationQueryDto) {
    return this.testsService.findAll(query);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.testsService.remove(id);
  }

  @Post('start')
  @Roles('user')
  async startTest(
    @Req() req: RequestWithUser,
    @Body() dto: StartTestDto,
    @Query() pagination: PaginationQueryDto
  ) {
    const { page = 1, limit = 10 } = pagination;
    return this.testsService.startTest(req.user!.id!, dto.test_id, page, limit);
  }

  @Post('progress')
  @Roles('user')
  saveProgress(@Req() req: RequestWithUser, @Body() dto: SubmitTestDto) {
    return this.testsService.saveTestProgress(
      req.user!.id!,
      dto.test_attempt_id,
      dto.remaining_duration,
      dto.answers
    );
  }

  @Post('submit')
  @Roles('user')
  submitTest(@Req() req: RequestWithUser, @Body() dto: SubmitTestDto) {
    return this.testsService.submitTest(
      req.user!.id!,
      dto.test_attempt_id,
      dto.remaining_duration,
      dto.answers
    );
  }
}
