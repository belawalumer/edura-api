import { IsInt, IsNotEmpty } from 'class-validator';

export class StartTestDto {
  @IsInt()
  @IsNotEmpty()
  test_id: number;
}
