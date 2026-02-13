import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PastPapersService } from './past-papers.service';
import { CreatePastPaperDto } from './dto/create-past-paper.dto';
import { UpdatePastPaperDto } from './dto/update-past-paper.dto';
import { PaginationQueryDto } from 'src/common/dto';

@Controller('past-papers')
export class PastPapersController {
  constructor(private readonly service: PastPapersService) {}

  @Post()
  async create(@Body() dto: CreatePastPaperDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdatePastPaperDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.service.remove(Number(id));
  }
}
