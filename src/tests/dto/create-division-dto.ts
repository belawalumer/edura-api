import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsInt,
  Min,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { CreateQuestionDto } from './create-question-dto';

export class CreateDivisionDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsNotEmpty()
  title: string;

  @IsInt()
  @Min(1)
  total_questions: number;

  @IsInt()
  @Min(1)
  duration_minutes: number;

  @IsInt()
  @IsNotEmpty()
  subjectId: number;

  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
