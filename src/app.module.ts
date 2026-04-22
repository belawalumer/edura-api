import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { GradesModule } from './grades/grades.module';
import { SubjectsModule } from './subjects/subjects.module';
import { GradeSubjectsModule } from './grade-subjects/grade-subjects.module';
import { ChaptersModule } from './chapters/chapters.module';
import { TestsModule } from './tests/tests.module';
import { BannersAnnouncementsModule } from './banners_announcements/banners_announcements.module';
import { FaqsModule } from './faqs/faqs.module';
import { UserModule } from './user/user.module';
import { JobsModule } from './jobs/jobs.module';
import { PastPapersModule } from './past-papers/past-papers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IndustriesModule } from './industries/industries.module';
import { DepartmentsModule } from './departments/departments.module';
import { CareerLevelsModule } from './career-levels/career-levels.module';
import { LocationsModule } from './locations/locations.module';
import { ExamCategoryModule } from './exam-category/exam-category.module';
import { UniversitiesModule } from './universities/universities.module';
import { CollegesModule } from './colleges/colleges.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    AuthModule,
    CategoriesModule,
    GradesModule,
    SubjectsModule,
    GradeSubjectsModule,
    ChaptersModule,
    TestsModule,
    BannersAnnouncementsModule,
    FaqsModule,
    UserModule,
    JobsModule,
    PastPapersModule,
    DashboardModule,
    IndustriesModule,
    DepartmentsModule,
    CareerLevelsModule,
    LocationsModule,
    ExamCategoryModule,
    UniversitiesModule,
    CollegesModule,
  ],
})
export class AppModule {}
