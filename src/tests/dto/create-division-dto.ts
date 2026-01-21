import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsInt,
  Min,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { CreateQuestionDto } from './create-question-dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDivisionDto {
  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 'Biology' })
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  total_questions: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  duration_minutes: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  @IsNotEmpty()
  subjectId: number;

  @ApiProperty({ type: CreateQuestionDto })
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
