import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { CreateQuestionDto } from './create-question-dto';

export class CreateDivisionDto {
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
  @ArrayMinSize(1)
  questions: CreateQuestionDto[];
}
