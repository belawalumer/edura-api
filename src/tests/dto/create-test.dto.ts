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
  @ApiProperty({ example: 'Math Test' })
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  total_questions: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  duration_minutes: number;

  @ApiProperty({ example: 39 })
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @ApiPropertyOptional({ example: 17 })
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  gradeId?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  subjectId?: number;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 5 })
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
