import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AnswerDto {
  @ApiProperty({ example: 170 })
  @IsInt()
  @IsNotEmpty()
  question_id: number;

  @ApiProperty({ example: 650 })
  @IsOptional()
  @IsInt()
  @IsNotEmpty()
  selected_option_id: number | null;
}

export class SubmitTestDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  @IsNotEmpty()
  test_attempt_id: number;

  @ApiProperty({ example: 60 })
  @IsInt()
  @IsNotEmpty()
  remaining_duration: number;

  @ApiProperty({ type: AnswerDto })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
