import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ example: 'can i use the app without signingup?' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'No' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  visibility?: boolean;
}
