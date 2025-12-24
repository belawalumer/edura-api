import { PartialType } from '@nestjs/swagger';
import { CreateGradeDto } from './create-grade.dto';
import { ArrayNotEmpty, IsArray, IsOptional } from 'class-validator';

export class UpdateGradeDto extends PartialType(CreateGradeDto) {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  subjectIds?: number[];
}
