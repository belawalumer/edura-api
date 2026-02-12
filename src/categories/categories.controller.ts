import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { PaginationQueryDto } from '../common/dto/index';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query() query: PaginationQueryDto) {
    return await this.categoriesService.findAll(query);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return await this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.categoriesService.remove(id);
  }
}
