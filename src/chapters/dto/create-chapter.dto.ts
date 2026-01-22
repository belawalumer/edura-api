import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { Status } from '../../common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChapterDto {
  @ApiProperty({ example: 'Introduction to Computing' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({ example: 4 })
  @IsInt()
  gradeId: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  subjectId: number;
}
