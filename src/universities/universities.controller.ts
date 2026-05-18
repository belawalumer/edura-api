import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { GetUniversitiesQueryDto } from './dto/get-universities-query.dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Get()
  @Public()
  async getAll(@Query() query: GetUniversitiesQueryDto) {
    return this.universitiesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.universitiesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async create(@Body() dto: CreateUniversityDto) {
    return this.universitiesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUniversityDto,
  ) {
    return this.universitiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.universitiesService.remove(id);
  }
}