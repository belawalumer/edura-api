import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Status } from '../../common/enums';
import { Type } from 'class-transformer';

export class CreatePastPaperDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  category_id: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  board_id?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  grade_id?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  subject_id?: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  year: number;

  @IsOptional()
  @IsString()
  file?: string;

  @IsEnum(Status)
  status?: Status = Status.ACTIVE;
}
