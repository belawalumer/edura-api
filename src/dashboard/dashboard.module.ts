import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Test } from '../tests/entities/test.entity';
import { BannersAnnouncement } from '../banners_announcements/entities/banners_announcement.entity';
import { TestAttempt } from 'src/tests/entities/test_attempt.entity';
import { Job } from 'src/jobs/entities/job.entity';
import { TestimonialsModule } from 'src/testimonials/testimonials.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Test, BannersAnnouncement, TestAttempt, Job]),
    TestimonialsModule,
    NotificationsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
