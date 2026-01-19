import { Module } from '@nestjs/common';
import { BannersAnnouncementsService } from './banners_announcements.service';
import { BannersAnnouncementsController } from './banners_announcements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersAnnouncement } from './entities/banners_announcement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BannersAnnouncement])],
  controllers: [BannersAnnouncementsController],
  providers: [BannersAnnouncementsService],
})
export class BannersAnnouncementsModule {}
