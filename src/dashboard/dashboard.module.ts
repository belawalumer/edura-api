import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Test } from '../tests/entities/test.entity';
import { BannersAnnouncement } from '../banners_announcements/entities/banners_announcement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Test, BannersAnnouncement])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
