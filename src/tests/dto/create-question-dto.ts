import {
  IsNotEmpty,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOptionDto } from './create-option-dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 'What is 2 + 2?' })
  @IsNotEmpty()
  title: string;

  @ApiProperty({ type: CreateOptionDto })
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @ArrayMinSize(4)
  options: CreateOptionDto[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  divisionId?: number;
}
