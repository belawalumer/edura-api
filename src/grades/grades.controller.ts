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
  Req,
} from '@nestjs/common';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { PaginationQueryDto } from 'src/common/dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import type { RequestWithUser } from 'src/auth/guard/auth_guard';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(AuthGuard)
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get('meta')
  @Public()
  getMeta() {
    return this.gradesService.getGradesMeta();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradesService.create(createGradeDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  findAll(@Query() query: PaginationQueryDto, @Req() req: RequestWithUser) {
    const role = (req.user?.role as UserRole) ?? UserRole.USER;
    return this.gradesService.findAll(query, role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGradeDto: UpdateGradeDto
  ) {
    return this.gradesService.update(id, updateGradeDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gradesService.remove(id);
  }
}
