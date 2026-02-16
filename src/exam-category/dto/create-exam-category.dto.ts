import { IsNotEmpty, IsString } from 'class-validator';

export class CreateExamCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;
}
