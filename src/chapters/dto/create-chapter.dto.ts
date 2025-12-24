import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { Status } from '../../common/enums';

export class CreateChapterDto {
  @IsNotEmpty()
  name: string;

  @IsEnum(Status)
  status: Status;

  @IsInt()
  gradeId: number;

  @IsInt()
  subjectId: number;
}
