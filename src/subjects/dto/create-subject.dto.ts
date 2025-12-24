import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Status } from 'src/common/enums';

export class CreateSubjectDto {
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsOptional()
  @IsEnum(Status, { message: 'Status must be active or inactive' })
  status?: Status;
}
