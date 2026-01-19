import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { CreateQuestionDto } from './create-question-dto';

export class UpdateDivisionDto {
  @IsInt()
  id: number;

  @IsOptional()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  total_questions?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  @IsOptional()
  @IsInt()
  subjectId?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @ArrayMinSize(1)
  questions?: CreateQuestionDto[];
}
