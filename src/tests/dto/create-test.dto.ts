import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { CreateQuestionDto } from './create-question-dto';

export class CreateTestDto {
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
  categoryId: number;

  @IsInt()
  @IsNotEmpty()
  gradeId: number;

  @IsInt()
  @IsNotEmpty()
  subjectId: number;

  @IsInt()
  @IsOptional()
  chapterId?: number | null;

  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @ArrayMinSize(1)
  questions: CreateQuestionDto[];
}
