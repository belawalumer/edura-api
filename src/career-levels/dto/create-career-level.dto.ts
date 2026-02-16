import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCareerLevelDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
