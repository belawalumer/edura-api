import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto';

export class GetJobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by location ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  location_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by department ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  department_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by industry ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  industry_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by industry IDs, comma-separated',
    example: '1,2,3',
  })
  @IsOptional()
  @IsString()
  industry_ids?: string;

  @ApiPropertyOptional({
    description: 'Filter by career level ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  career_level_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by career level IDs, comma-separated',
    example: '1,2,3',
  })
  @IsOptional()
  @IsString()
  career_level_ids?: string;

  @ApiPropertyOptional({
    description: 'When true, return only jobs saved by the authenticated user',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  saved_only?: boolean;
}
