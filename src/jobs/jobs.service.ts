import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { SavedJob } from './entities/saved_jobs.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { GetJobsQueryDto } from './dto/get-jobs-query.dto';
import { JobPreferredCandidate } from './entities/job_preferred_candidates.entity';
import { Industry } from '../industries/entities/industry.entity';
import { CareerLevel } from '../career-levels/entities/career-level.entity';
import { Department } from '../departments/entities/department.entity';
import { Location } from '../locations/entities/location.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(SavedJob)
    private readonly savedJobRepo: Repository<SavedJob>,
    @InjectRepository(JobPreferredCandidate)
    private readonly preferredRepo: Repository<JobPreferredCandidate>,
    @InjectRepository(Industry)
    private readonly industryRepo: Repository<Industry>,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    @InjectRepository(CareerLevel)
    private readonly careerLevelRepo: Repository<CareerLevel>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>
  ) {}

  async getAllJobs(query: GetJobsQueryDto, userId?: number) {
    const {
      page = 1,
      limit = 10,
      search,
      location_id,
      department_id,
      industry_id,
      industry_ids,
      career_level_id,
      career_level_ids,
      saved_only,
    } = query;

    let savedIds = new Set<number>();
    if (userId != null) {
      const raw = await this.savedJobRepo
        .createQueryBuilder('s')
        .select('s.job_id', 'job_id')
        .where('s.user_id = :userId', { userId })
        .getRawMany<{ job_id: number }>();
      savedIds = new Set(raw.map((r) => r.job_id).filter((id) => id != null));
    }

    if (saved_only && userId != null) {
      if (savedIds.size === 0) {
        return {
          message: 'Jobs retrieved successfully',
          data: {
            items: [],
            meta: {
              total: 0,
              page,
              limit,
              totalPages: 0,
              hasMore: false,
            },
          },
        };
      }
    }

    const qb = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.industry', 'industry')
      .leftJoinAndSelect('job.department', 'department')
      .leftJoinAndSelect('job.location', 'location')
      .leftJoinAndSelect('job.careerLevel', 'careerLevel')
      .orderBy('job.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (saved_only && userId != null && savedIds.size > 0) {
      qb.andWhere('job.id IN (:...savedIds)', {
        savedIds: Array.from(savedIds),
      });
    }

    if (search) {
      qb.andWhere('job.title ILIKE :search', { search: `%${search}%` });
    }

    // Filters
    if (location_id != null) {
      qb.andWhere('job.location_id = :locationId', {
        locationId: location_id,
      });
    }

    if (department_id != null) {
      qb.andWhere('job.department_id = :departmentId', {
        departmentId: department_id,
      });
    }

    const industryIds = this.parseIds(industry_ids);
    if (industryIds.length > 0) {
      qb.andWhere('job.industry_id IN (:...industryIds)', {
        industryIds: industryIds,
      });
    } else if (industry_id != null) {
      qb.andWhere('job.industry_id = :industryId', {
        industryId: industry_id,
      });
    }

    const careerLevelIds = this.parseIds(career_level_ids);
    if (careerLevelIds.length > 0) {
      qb.andWhere('job.career_level_id IN (:...careerLevelIds)', {
        careerLevelIds: careerLevelIds,
      });
    } else if (career_level_id != null) {
      qb.andWhere('job.career_level_id = :careerLevelId', {
        careerLevelId: career_level_id,
      });
    }

    const [jobs, total] = await qb.getManyAndCount();

    const mappedItems = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      industry: job.industry,
      department: job.department,
      location: job.location,
      careerLevel: job.careerLevel,
      total_positions: job.total_positions,
      employment_status: job.employment_status,
      status: job.status,
      job_posted: job.job_posted,
      last_date_to_apply: job.last_date_to_apply,
      saved: userId != null ? savedIds.has(job.id) : false,
    }));

    return {
      message: 'Jobs retrieved successfully',
      data: {
        items: mappedItems,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    };
  }

  async getJobById(id: number) {
    const job = await this.jobRepo.findOne({
      where: { id },
      relations: [
        'industry',
        'department',
        'location',
        'careerLevel',
        'preferredCandidate',
      ],
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async createJob(createJobDto: CreateJobDto) {
    const {
      industry_id,
      department_id,
      location_id,
      career_level_id,
      preferred_candidate,
      ...simpleFields
    } = createJobDto;

    if (!industry_id) throw new NotFoundException('Industry is required');
    if (!department_id) throw new NotFoundException('Department is required');
    if (!location_id) throw new NotFoundException('Location is required');
    if (!career_level_id)
      throw new NotFoundException('Career level is required');

    const exists = await this.jobRepo.findOne({
      where: {
        title: createJobDto.title,
        role: createJobDto.role,
        industry: { id: industry_id },
        department: { id: department_id },
        location: { id: location_id },
      },
    });
    if (exists) throw new ConflictException('Job already exists');

    const job = this.jobRepo.create({
      ...simpleFields,
      industry: { id: industry_id },
      department: { id: department_id },
      location: { id: location_id },
      careerLevel: { id: career_level_id },
    });

    await this.jobRepo.save(job);

    if (preferred_candidate) {
      const preferred = this.preferredRepo.create({
        ...preferred_candidate,
        job,
      });
      await this.preferredRepo.save(preferred);
    }

    return this.getJobById(job.id);
  }

  async updateJob(id: number, updateJobDto: UpdateJobDto) {
    const job = await this.jobRepo.findOne({
      where: { id },
      relations: [
        'industry',
        'department',
        'location',
        'careerLevel',
        'preferredCandidate',
      ],
    });

    if (!job) throw new NotFoundException('Job not found');

    const {
      industry_id,
      department_id,
      location_id,
      career_level_id,
      preferred_candidate,
      ...simpleFields
    } = updateJobDto;

    if (industry_id)
      job.industry = this.industryRepo.create({ id: updateJobDto.industry_id });

    if (department_id)
      job.department = this.departmentRepo.create({
        id: updateJobDto.department_id,
      });

    if (location_id) {
      job.location = this.locationRepo.create({
        id: updateJobDto.location_id,
      });
    }

    if (career_level_id) {
      job.careerLevel = this.careerLevelRepo.create({
        id: updateJobDto.career_level_id,
      });
    }

    Object.assign(job, simpleFields);

    await this.jobRepo.save(job);

    if (preferred_candidate && job.preferredCandidate) {
      Object.assign(job.preferredCandidate, preferred_candidate);
      await this.preferredRepo.save(job.preferredCandidate);
    }

    return this.getJobById(job.id);
  }

  async deleteJob(id: number) {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');

    await this.jobRepo.remove(job);

    return { message: 'Job deleted permanently' };
  }

  async getJobMetaData() {
    const [industries, locations, careerLevels, departments] =
      await Promise.all([
        this.industryRepo.find({ order: { name: 'ASC' } }),
        this.locationRepo.find({ order: { name: 'ASC' } }),
        this.careerLevelRepo.find({ order: { name: 'ASC' } }),
        this.departmentRepo.find({ order: { name: 'ASC' } }),
      ]);

    return { industries, locations, careerLevels, departments };
  }

  async saveJob(userId: number, jobId: number) {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const existing = await this.savedJobRepo.findOne({
      where: { user_id: userId, job: { id: jobId } },
    });
    if (existing) throw new ConflictException('Job already saved');

    const savedJob = this.savedJobRepo.create({
      user_id: userId,
      job: { id: jobId },
    });
    await this.savedJobRepo.save(savedJob);

    return { message: 'Job saved successfully' };
  }

  async unsaveJob(userId: number, jobId: number) {
    const saved = await this.savedJobRepo.findOne({
      where: { user_id: userId, job: { id: jobId } },
    });
    if (!saved) throw new NotFoundException('Saved job not found');

    await this.savedJobRepo.remove(saved);
    return { message: 'Job removed from saved' };
  }

  private parseIds(idsString?: string): number[] {
    if (!idsString?.trim()) {
      return [];
    }
    return idsString
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n >= 1);
  }
}
