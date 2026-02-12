import { Module } from '@nestjs/common';
import { BannersAnnouncementsService } from './banners_announcements.service';
import { BannersAnnouncementsController } from './banners_announcements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersAnnouncement } from './entities/banners_announcement.entity';
import { User } from '../user/entities/user.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BannersAnnouncement, User]),
    CloudinaryModule,
  ],
  controllers: [BannersAnnouncementsController],
  providers: [BannersAnnouncementsService],
})
export class BannersAnnouncementsModule {}
