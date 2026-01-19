import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsInt()
  @IsNotEmpty()
  question_id: number;

  @IsOptional()
  @IsInt()
  @IsNotEmpty()
  selected_option_id: number | null;
}

export class SubmitTestDto {
  @IsInt()
  @IsNotEmpty()
  test_attempt_id: number;

  @IsInt()
  @IsNotEmpty()
  remaining_duration: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
