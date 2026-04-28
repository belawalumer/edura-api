import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class StartTestDto {
  @ApiProperty({ example: 95 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  test_id: number;
}
