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
import { BannersAnnouncementsService } from './banners_announcements.service';
import { CreateBannersAnnouncementDto } from './dto/create-banners_announcement.dto';
import { UpdateBannersAnnouncementDto } from './dto/update-banners_announcement.dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { PaginationQueryDto } from 'src/common/dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@UseGuards(AuthGuard)
@Controller('banners-announcements')
export class BannersAnnouncementsController {
  constructor(
    private readonly bannersAnnouncementsService: BannersAnnouncementsService
  ) {}

  @Post()
  @Roles('admin')
  async create(
    @Body() createBannersAnnouncementDto: CreateBannersAnnouncementDto
  ) {
    return await this.bannersAnnouncementsService.create(
      createBannersAnnouncementDto
    );
  }

  @Get()
  @Roles('admin')
  async findAll(@Query() query: PaginationQueryDto) {
    return await this.bannersAnnouncementsService.findAll(query);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.bannersAnnouncementsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBannersAnnouncementDto: UpdateBannersAnnouncementDto
  ) {
    return await this.bannersAnnouncementsService.update(
      id,
      updateBannersAnnouncementDto
    );
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.bannersAnnouncementsService.remove(id);
  }
}
