import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Industry } from './entities/industry.entity';
import { Location } from './entities/locations.entity';
import { CareerLevel } from './entities/career_levels.entity';
import { Department } from './entities/departments.entity';
import { UserModule } from '../user/user.module';
import { Job } from './entities/job.entity';
import { JobPreferredCandidate } from './entities/job_preferred_candidates.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      Industry,
      Location,
      CareerLevel,
      Department,
      JobPreferredCandidate,
    ]),
    UserModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
