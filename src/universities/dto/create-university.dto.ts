import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class MeritDto {
  @IsString()
  @IsNotEmpty()
  degree: string;

  @IsNumber()
  lastYearClosingMerit: number;
}

export class CreateUniversityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeritDto)
  merits: MeritDto[];
}