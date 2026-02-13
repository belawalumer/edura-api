import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Industry } from './entities/industry.entity';
import { Location } from './entities/locations.entity';
import { CareerLevel } from './entities/career_levels.entity';
import { Department } from './entities/departments.entity';
import { PaginationQueryDto } from 'src/common/dto';
import { JobPreferredCandidate } from './entities/job_preferred_candidates.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
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

  async getAllJobs(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.industry', 'industry')
      .leftJoinAndSelect('job.department', 'department')
      .leftJoinAndSelect('job.location', 'location')
      .leftJoinAndSelect('job.careerLevel', 'careerLevel')
      .orderBy('job.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('job.title ILIKE :search', { search: `%${search}%` });
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
    const exists = await this.jobRepo.findOne({
      where: { title: createJobDto.title },
    });
    if (exists) throw new ConflictException('Job already exists');

    let industryId = createJobDto.industry_id;
    if (!industryId && createJobDto.industry) {
      let industry = await this.industryRepo.findOne({
        where: { name: createJobDto.industry },
      });
      if (!industry) {
        industry = await this.industryRepo.save({
          name: createJobDto.industry,
        });
      }
      industryId = industry.id;
    }

    let departmentId = createJobDto.department_id;
    if (!departmentId && createJobDto.department) {
      let dept = await this.departmentRepo.findOne({
        where: { name: createJobDto.department },
      });
      if (!dept) {
        dept = await this.departmentRepo.save({
          name: createJobDto.department,
        });
      }
      departmentId = dept.id;
    }

    let locationId = createJobDto.location_id;
    if (!locationId && createJobDto.location) {
      let loc = await this.locationRepo.findOne({
        where: { name: createJobDto.location },
      });
      if (!loc) {
        loc = await this.locationRepo.save({
          name: createJobDto.location,
        });
      }
      locationId = loc.id;
    }

    let careerLevelId = createJobDto.career_level_id;
    if (!careerLevelId && createJobDto.career_level) {
      let level = await this.careerLevelRepo.findOne({
        where: { name: createJobDto.career_level },
      });
      if (!level) {
        level = await this.careerLevelRepo.save({
          name: createJobDto.career_level,
        });
      }
      careerLevelId = level.id;
    }

    const job = this.jobRepo.create({
      ...createJobDto,
      industry: industryId ? ({ id: industryId } as Industry) : undefined,
      department: departmentId
        ? ({ id: departmentId } as Department)
        : undefined,
      location: locationId ? ({ id: locationId } as Location) : undefined,
      careerLevel: careerLevelId
        ? ({ id: careerLevelId } as CareerLevel)
        : undefined,
    });

    await this.jobRepo.save(job);

    if (createJobDto.preferred_candidate) {
      const preferred = this.preferredRepo.create({
        ...createJobDto.preferred_candidate,
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

    if (preferred_candidate) {
      if (!job.preferredCandidate) {
        const newPreferred = this.preferredRepo.create(preferred_candidate);
        newPreferred.job = job;
        await this.preferredRepo.save(newPreferred);
      } else {
        Object.assign(job.preferredCandidate, preferred_candidate);
        await this.preferredRepo.save(job.preferredCandidate);
      }
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
}
