import { Injectable, NotFoundException } from '@nestjs/common';
import { Test } from '../tests/entities/test.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BannersAnnouncement } from 'src/banners_announcements/entities/banners_announcement.entity';
import { Status, UserRole } from 'src/common/enums';
import { User } from 'src/user/entities/user.entity';
import { TestAttempt } from 'src/tests/entities/test_attempt.entity';
import { TestStatus } from 'src/common/enums';
import { Job } from 'src/jobs/entities/job.entity';
import { TestimonialsService } from 'src/testimonials/testimonials.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Test) private readonly testRepo: Repository<Test>,
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepo: Repository<TestAttempt>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(BannersAnnouncement)
    private readonly announcementRepo: Repository<BannersAnnouncement>,
    private readonly testimonialsService: TestimonialsService
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

  async getHomeData() {
    const announcements = await this.announcementRepo.find({
      where: { status: Status.ACTIVE },
      order: { id: 'DESC' },
      take: 8,
    });

    const jobs = await this.jobRepo.find({
      where: { status: Status.ACTIVE },
      relations: ['department', 'location'],
      order: { created_at: 'DESC' },
      take: 8,
    });

    const sampleTest = await this.testRepo.findOne({
      where: { status: Status.ACTIVE },
      order: { id: 'ASC' },
    });

    const topScorers = await this.userRepo.find({
      where: { role: UserRole.USER, isSuspended: false },
      order: { total_coins: 'DESC', id: 'ASC' },
      take: 10,
    });

    const testimonials = await this.testimonialsService.findAll();

    const [totalStudents, totalTests, totalJobs] = await Promise.all([
      this.userRepo.count({ where: { role: UserRole.USER } }),
      this.testRepo.count(),
      this.jobRepo.count({ where: { status: Status.ACTIVE } }),
    ]);

    return {
      message: 'Home data retrieved successfully',
      data: {
        announcements,
        stats: {
          total_students: totalStudents,
          total_tests: totalTests,
          total_universities: 100, // placeholder, can be made dynamic
          total_jobs: totalJobs,
        },
        jobs: jobs.map((job) => ({
          id: job.id,
          title: job.title,
          department: job.department?.name ?? null,
          location: job.location?.name ?? null,
          last_date_to_apply: job.last_date_to_apply,
        })),
        sample_test: sampleTest
          ? {
              id: sampleTest.id,
              title: sampleTest.title,
              total_questions: sampleTest.total_questions,
              total_duration: sampleTest.total_duration,
            }
          : null,
        top_scorers: topScorers.map((user, index) => ({
          rank: index + 1,
          user_id: user.id,
          name: user.name,
          image: user.image ?? null,
          score: Number(user.total_coins ?? 0),
        })),
        testimonials: testimonials.slice(0, 6),
      },
    };
  }

  async getAnnouncementById(id: number) {
    const announcement = await this.announcementRepo.findOne({
      where: { id, status: Status.ACTIVE },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return {
      message: 'Announcement retrieved successfully',
      data: announcement,
    };
  }

  async getNotifications(authUserId: number) {
    const [recentAnnouncements, recentJobs, inProgressAttempts] = await Promise.all([
      this.announcementRepo.find({
        where: { status: Status.ACTIVE },
        order: { activeFrom: 'DESC' },
        take: 3,
      }),
      this.jobRepo.find({
        where: { status: Status.ACTIVE },
        order: { created_at: 'DESC' },
        take: 3,
      }),
      this.testAttemptRepo.find({
        where: { user_id: authUserId, status: TestStatus.IN_PROGRESS },
        relations: ['test'],
        order: { created_at: 'DESC' },
        take: 2,
      }),
    ]);

    const items = [
      ...recentAnnouncements.map((item) => ({
        id: `announcement-${item.id}`,
        type: 'Announcements',
        title: item.title,
        description: item.description,
        createdAt: item.activeFrom,
        to: `/announcements/${item.id}`,
      })),
      ...recentJobs.map((job) => ({
        id: `jobs-${job.id}`,
        type: 'Jobs',
        title: `New job: ${job.title}`,
        description: 'A new opportunity is now available. Tap to view details.',
        createdAt: job.created_at,
        to: `/jobs`,
      })),
      ...inProgressAttempts.map((attempt) => ({
        id: `tests-${attempt.id}`,
        type: 'Tests',
        title: `Resume ${attempt.test?.title ?? 'your test'}`,
        description: 'You have an in-progress test waiting for completion.',
        createdAt: attempt.created_at,
        to: `/tests`,
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      message: 'Notifications retrieved successfully',
      data: {
        items,
      },
    };
  }

  async getUserProgress(authUserId: number) {
    const attempts = await this.testAttemptRepo.find({
      where: {
        user_id: authUserId,
        status: TestStatus.COMPLETED,
      },
      relations: ['test', 'test.subject'],
      order: { created_at: 'DESC' },
    });

    const testsCompleted = attempts.length;
    const totalCorrect = attempts.reduce((sum, a) => sum + Number(a.total_correct ?? 0), 0);
    const totalWrong = attempts.reduce((sum, a) => sum + Number(a.total_wrong ?? 0), 0);
    const totalAnswered = totalCorrect + totalWrong;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyAttempts = attempts.filter((a) => new Date(a.created_at) >= sevenDaysAgo);

    const weeklySpentMinutes = weeklyAttempts.reduce((sum, a) => {
      const totalDurationMin = Number(a.test?.total_duration ?? 0);
      const remainingSec = Number(a.remaining_duration ?? 0);
      const spentMin = Math.max(totalDurationMin - remainingSec / 60, 0);
      return sum + spentMin;
    }, 0);

    const byDay = new Set(
      attempts.map((a) => {
        const d = new Date(a.created_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
    let streak = 0;
    const cursor = new Date();
    let key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;

    if (!byDay.has(key)) {
      cursor.setDate(cursor.getDate() - 1);
      key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    }

    while (byDay.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    }

    const testScores = attempts.slice(0, 5).reverse().map((attempt, index) => {
      const answered = Number(attempt.total_correct ?? 0) + Number(attempt.total_wrong ?? 0);
      const score = answered > 0 ? Math.round((Number(attempt.total_correct ?? 0) / answered) * 100) : 0;
      return { test: String(index + 1), score };
    });

    const subjectAgg = new Map<string, { totalCorrect: number; totalAnswered: number }>();
    for (const attempt of attempts) {
      const subjectName = attempt.test?.subject?.name ?? 'General';
      const item = subjectAgg.get(subjectName) ?? { totalCorrect: 0, totalAnswered: 0 };
      const correct = Number(attempt.total_correct ?? 0);
      const wrong = Number(attempt.total_wrong ?? 0);
      item.totalCorrect += correct;
      item.totalAnswered += correct + wrong;
      subjectAgg.set(subjectName, item);
    }
    const subjectPerformance = Array.from(subjectAgg.entries())
      .map(([subject, value]) => ({
        subject,
        score:
          value.totalAnswered > 0
            ? Math.round((value.totalCorrect / value.totalAnswered) * 100)
            : 0,
      }))
      .slice(0, 8);

    return {
      message: 'Progress retrieved successfully',
      data: {
        weekly_performance: accuracy,
        time_spent_hours: Number((weeklySpentMinutes / 60).toFixed(1)),
        tests_completed: testsCompleted,
        streak_days: streak,
        test_scores: testScores,
        subject_performance: subjectPerformance,
      },
    };
  }
}
