import { IsEnum, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { Status } from 'src/common/enums';

export class CreateGradeDto {
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsInt({ message: 'Category ID must be an integer' })
  categoryId: number;

  @IsOptional()
  @IsEnum(Status, { message: 'Status must be active or inactive' })
  status?: Status;
}
