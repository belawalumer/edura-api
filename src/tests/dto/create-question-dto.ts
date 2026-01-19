import {
  IsNotEmpty,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOptionDto } from './create-option-dto';

export class CreateQuestionDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsNotEmpty()
  title: string;

  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @ArrayMinSize(4)
  options: CreateOptionDto[];

  @IsOptional()
  @IsInt()
  divisionId?: number;
}
