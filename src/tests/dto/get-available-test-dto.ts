import { IsEnum, IsOptional, IsNumberString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto';
import { CategoryType, EntryType } from 'src/common/enums';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class SelectableTestsQueryDto {
  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)
  type: CategoryType;

  @ApiPropertyOptional({
    description: 'Required when type=subject',
    type: String,
  })
  @IsOptional()
  @IsNumberString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Required when type=subject',
    type: String,
  })
  @IsOptional()
  @IsNumberString()
  gradeId?: string;

  @ApiPropertyOptional({
    description: 'Entry parent test ID when selecting divisions/tests for one entry test',
    type: String,
  })
  @IsOptional()
  @IsNumberString()
  testId?: string;

  @ApiPropertyOptional({
    enum: EntryType,
    description: 'Optional when type=entry; testId can be used instead',
  })
  @IsOptional()
  @IsEnum(EntryType)
  entryType?: EntryType;
}

export class AvailableTestsQueryDto extends PaginationQueryDto {
  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)
  type: CategoryType;

  @ApiPropertyOptional({
    description: 'Grade ID is required for subject tests',
    type: String,
    example: '17',
  })
  @IsOptional()
  @IsNumberString()
  gradeId?: string;

  @ApiPropertyOptional({ enum: EntryType })
  @IsOptional()
  @IsEnum(EntryType)
  entryType?: EntryType;
}

export interface BasicTestDivision {
  id: number;
  title: string;
  total_questions: number;
  total_duration: number;
  status?: 'active' | 'in_progress' | 'completed';
  remaining_duration?: number | null;
  attempted_questions?: number;
  coins_earned?: number;
  correct_marks: number;
  negative_marks: number;
  skipped_marks: number;
  marks?: number;
  total_correct?: number;
  total_wrong?: number;
  total_skipped?: number;
  completed_time?: Date;
  time_taken?: string;
}

export interface TestDetailsBasic {
  id: number;
  title: string;
  total_questions: number;
  total_duration: number;
  correct_marks: number;
  negative_marks: number;
  skipped_marks: number;
  divisions?: BasicTestDivision[];
  status?: 'active' | 'in_progress' | 'completed';
  remaining_duration?: number | null;
  attempted_questions?: number;
  coins_earned?: number;
  marks?: number;
  total_correct?: number;
  total_wrong?: number;
  total_skipped?: number;
  completed_time?: Date;
  time_taken?: string;
  entry_total_questions?: number;
  entry_total_duration?: number;
  entry_divisions_count?: number;
}
