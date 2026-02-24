import { IsEnum, IsOptional, IsNumberString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto';
import { CategoryType, EntryType } from 'src/common/enums';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

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
  status?: 'active' | 'in_progress';
  remaining_duration?: number | null;
  attempted_questions?: number;
  coins_earned?: number;
}

export interface TestDetailsBasic {
  id: number;
  title: string;
  total_questions: number;
  total_duration: number;
  divisions?: BasicTestDivision[];
  status?: 'active' | 'in_progress';
  remaining_duration?: number | null;
  attempted_questions?: number;
}
