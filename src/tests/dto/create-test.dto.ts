import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
  IsEnum,
  IsNumber,
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

  @ApiPropertyOptional({
    description: 'Marks per correct answer (default 1)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  correct_marks?: number;

  @ApiPropertyOptional({
    description: 'Marks per incorrect answer (default 0; can be negative e.g. -0.25)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  negative_marks?: number;

  @ApiPropertyOptional({
    description: 'Marks when question is skipped (default 0)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  skipped_marks?: number;

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
