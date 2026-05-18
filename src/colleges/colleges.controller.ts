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
import { CollegesService } from './colleges.service';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { GetCollegesQueryDto } from './dto/get-colleges-query.dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('colleges')
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  @Get()
  @Public()
  async getAll(@Query() query: GetCollegesQueryDto) {
    return this.collegesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.collegesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async create(@Body() dto: CreateCollegeDto) {
    return this.collegesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollegeDto,
  ) {
    return this.collegesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.collegesService.remove(id);
  }
}