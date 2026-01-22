import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class CreateOptionDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 'Branches' })
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect: boolean;
}
