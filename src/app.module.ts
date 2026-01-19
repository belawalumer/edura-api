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
  ],
})
export class AppModule {}
