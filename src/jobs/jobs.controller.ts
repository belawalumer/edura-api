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
  Req,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { GetJobsQueryDto } from './dto/get-jobs-query.dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import type { RequestWithUser } from 'src/auth/guard/auth_guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(AuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @Public()
  async getAllJobs(
    @Query() query: GetJobsQueryDto,
    @Req() req: RequestWithUser
  ) {
    const userId = req.user?.id;
    return this.jobsService.getAllJobs(query, userId);
  }

  @Get('meta')
  @Public()
  async getMeta() {
    return this.jobsService.getJobMetaData();
  }

  @Post('saved-jobs/:jobId')
  async saveJob(
    @Req() req: RequestWithUser,
    @Param('jobId', ParseIntPipe) jobId: number
  ) {
    const userId = req.user?.id;
    if (userId == null)
      throw new UnauthorizedException('User not authenticated');
    return this.jobsService.saveJob(userId, jobId);
  }

  @Delete('saved-jobs/:jobId')
  async unsaveJob(
    @Req() req: RequestWithUser,
    @Param('jobId', ParseIntPipe) jobId: number
  ) {
    const userId = req.user?.id;
    if (userId == null)
      throw new UnauthorizedException('User not authenticated');
    return this.jobsService.unsaveJob(userId, jobId);
  }

  @Get(':id')
  @Public()
  async getJobById(@Param('id') id: number) {
    return this.jobsService.getJobById(Number(id));
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async createJob(@Body() dto: CreateJobDto) {
    return this.jobsService.createJob(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async updateJob(@Param('id') id: number, @Body() dto: UpdateJobDto) {
    return this.jobsService.updateJob(Number(id), dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async deleteJob(@Param('id') id: number) {
    return this.jobsService.deleteJob(Number(id));
  }
}
