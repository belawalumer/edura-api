import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Status } from 'src/common/enums';

export class CreateGradeDto {
  @ApiProperty({ example: '10th' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiPropertyOptional({ enum: Status, example: Status.ACTIVE })
  @IsOptional()
  @IsEnum(Status, { message: 'Status must be active or inactive' })
  status?: Status;
}
