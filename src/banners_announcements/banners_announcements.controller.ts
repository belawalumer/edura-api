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
} from '@nestjs/common';
import { BannersAnnouncementsService } from './banners_announcements.service';
import { CreateBannersAnnouncementDto } from './dto/create-banners_announcement.dto';
import { UpdateBannersAnnouncementDto } from './dto/update-banners_announcement.dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { PaginationQueryDto } from 'src/common/dto';

@UseGuards(AuthGuard)
@Controller('banners-announcements')
export class BannersAnnouncementsController {
  constructor(
    private readonly bannersAnnouncementsService: BannersAnnouncementsService,
  ) {}

  @Post()
  async create(
    @Body() createBannersAnnouncementDto: CreateBannersAnnouncementDto,
  ) {
    return await this.bannersAnnouncementsService.create(
      createBannersAnnouncementDto,
    );
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return await this.bannersAnnouncementsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.bannersAnnouncementsService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBannersAnnouncementDto: UpdateBannersAnnouncementDto,
  ) {
    return await this.bannersAnnouncementsService.update(
      +id,
      updateBannersAnnouncementDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.bannersAnnouncementsService.remove(+id);
  }
}
