import { IsString, IsOptional } from 'class-validator';

export class CreateJobApplicationDto {
  @IsOptional()
  @IsString()
  cover_letter?: string;
}