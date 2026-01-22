import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class StartTestDto {
  @ApiProperty({ example: 95 })
  @IsInt()
  @IsNotEmpty()
  test_id: number;
}
