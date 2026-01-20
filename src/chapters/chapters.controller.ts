import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { PaginationQueryDto } from 'src/common/dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';

@UseGuards(AuthGuard)
@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createChapterDto: CreateChapterDto) {
    return this.chaptersService.create(createChapterDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: PaginationQueryDto) {
    return this.chaptersService.findAll(query);
  }

  @Get('by-grade-subject')
  @Roles(UserRole.ADMIN)
  getChaptersByGradeAndSubject(
    @Query('gradeId', ParseIntPipe) gradeId: number,
    @Query('subjectId', ParseIntPipe) subjectId: number
  ) {
    return this.chaptersService.findByGradeAndSubject(gradeId, subjectId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChapterDto: UpdateChapterDto
  ) {
    return this.chaptersService.update(id, updateChapterDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chaptersService.remove(id);
  }
}
