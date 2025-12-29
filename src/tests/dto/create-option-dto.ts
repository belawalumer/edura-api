import { IsNotEmpty, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class CreateOptionDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsNotEmpty()
  value: string;

  @IsBoolean()
  isCorrect: boolean;
}
