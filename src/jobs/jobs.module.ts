import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { Job } from './entities/job.entity';
import { JobPreferredCandidate } from './entities/job_preferred_candidates.entity';
import { SavedJob } from './entities/saved_jobs.entity';
import { Industry } from '../industries/entities/industry.entity';
import { Location } from '../locations/entities/location.entity';
import { CareerLevel } from '../career-levels/entities/career-level.entity';
import { Department } from '../departments/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      SavedJob,
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
