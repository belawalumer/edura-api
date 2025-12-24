import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Status } from 'src/common/enums';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsOptional()
  @IsEnum(Status, { message: 'Status must be active or inactive' })
  status?: Status;
}
