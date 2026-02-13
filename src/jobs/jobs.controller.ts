import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { PaginationQueryDto } from 'src/common/dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';

@UseGuards(AuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllJobs(@Query() query: PaginationQueryDto) {
    return this.jobsService.getAllJobs(query);
  }

  @Get('meta')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async getMeta() {
    return this.jobsService.getJobMetaData();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async createJob(@Body() dto: CreateJobDto) {
    return this.jobsService.createJob(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updateJob(@Param('id') id: number, @Body() dto: UpdateJobDto) {
    return this.jobsService.updateJob(Number(id), dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteJob(@Param('id') id: number) {
    return this.jobsService.deleteJob(Number(id));
  }
}
