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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTestDto {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsEnum(Status)
  status: Status;

  @ApiProperty()
  @IsInt()
  @Min(1)
  total_questions: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  duration_minutes: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  gradeId?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  subjectId?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  chapterId?: number | null;

  @ApiPropertyOptional({ type: [CreateQuestionDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @IsOptional()
  questions?: CreateQuestionDto[];

  @ApiPropertyOptional({ type: [CreateDivisionDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateDivisionDto)
  @IsOptional()
  divisions?: CreateDivisionDto[];
}
