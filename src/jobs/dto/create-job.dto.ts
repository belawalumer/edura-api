import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmploymentStatus, Status, Gender } from '../../common/enums';

export class PreferredCandidateDto {
  @IsNumber()
  years_of_experience: number;

  @IsNumber()
  min_age: number;

  @IsNumber()
  max_age: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  required_division?: string;
}

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsNumber()
  industry_id?: number;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  department_id?: number;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsNumber()
  location_id?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  career_level_id?: number;

  @IsOptional()
  @IsString()
  career_level?: string;

  @IsOptional()
  @IsString()
  division?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  degree_level?: string;

  @IsOptional()
  @IsString()
  degree_area?: string;

  @IsNumber()
  total_positions: number;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  project?: string;

  @IsEnum(EmploymentStatus)
  employment_status: EmploymentStatus;

  @IsOptional()
  @IsNumber()
  monthly_salary?: number;

  @IsOptional()
  @IsString()
  job_description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsDateString()
  job_posted: string;

  @IsDateString()
  last_date_to_apply: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PreferredCandidateDto)
  preferred_candidate?: PreferredCandidateDto;
}
