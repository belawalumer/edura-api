import { Injectable } from '@nestjs/common';
import { Test } from '../tests/entities/test.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BannersAnnouncement } from 'src/banners_announcements/entities/banners_announcement.entity';
import { Status, UserRole } from 'src/common/enums';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Test) private readonly testRepo: Repository<Test>,
    @InjectRepository(BannersAnnouncement)
    private readonly announcementRepo: Repository<BannersAnnouncement>
  ) {}

  async getAdminDashboard() {
    const total_students = await this.userRepo.count({
      where: { role: UserRole.USER },
    });

    const total_tests = await this.testRepo.count();

    const active_announcements = await this.announcementRepo.count({
      where: { status: Status.ACTIVE },
    });

    const students_joined_per_month = await this.userRepo
      .createQueryBuilder('student')
      .select(`TO_CHAR(student.createdAt, 'Mon')`, 'month')
      .addSelect('COUNT(*)', 'count')
      .where('student.role = :role', { role: 'user' })
      .groupBy('month')
      .orderBy('month')
      .getRawMany();

    const tests_per_subject = await this.testRepo
      .createQueryBuilder('test')
      .leftJoinAndSelect('test.subject', 'subject')
      .select('subject.name', 'subject')
      .addSelect('COUNT(test.id)', 'count')
      .groupBy('subject.name')
      .getRawMany();

    const latest_announcement = await this.announcementRepo.findOne({
      where: { status: Status.ACTIVE },
    });

    return {
      total_students,
      total_tests,
      active_announcements,
      students_joined_per_month,
      tests_per_subject,
      latest_announcement,
    };
  }
}
