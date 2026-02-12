import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsBoolean()
  @IsOptional()
  visibility?: boolean;
}
