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
import { PaginationQueryDto } from 'src/common/dto';
import { JobPreferredCandidate } from './entities/job_preferred_candidates.entity';
import { Industry } from '../industries/entities/industry.entity';
import { CareerLevel } from '../career-levels/entities/career-level.entity';
import { Department } from '../departments/entities/department.entity';
import { Location } from '../locations/entities/location.entity';

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
}
