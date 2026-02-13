import { IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';
import { Status } from '../../common/enums';

export class CreatePastPaperDto {
  @IsNotEmpty()
  @IsNumber()
  category_id: number;

  @IsNotEmpty()
  @IsNumber()
  grade_id: number;

  @IsNotEmpty()
  @IsNumber()
  subject_id: number;

  @IsNotEmpty()
  @IsNumber()
  year: number;

  @IsNotEmpty()
  @IsString()
  file_url: string;

  @IsEnum(Status)
  status?: Status = Status.ACTIVE;
}
