import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { CreateQuestionDto } from './create-question-dto';
import { CreateDivisionDto } from './create-division-dto';
import { Status } from 'src/common/enums';

export class CreateTestDto {
  @IsNotEmpty()
  title: string;

  @IsEnum(Status)
  status: Status;

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
  @IsOptional()
  gradeId?: number;

  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  subjectId?: number;

  @IsInt()
  @IsOptional()
  chapterId?: number | null;

  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @IsOptional()
  questions?: CreateQuestionDto[];

  @ValidateNested({ each: true })
  @Type(() => CreateDivisionDto)
  @IsOptional()
  divisions?: CreateDivisionDto[];
}
