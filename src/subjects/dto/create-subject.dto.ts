import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Status } from 'src/common/enums';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Math' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiPropertyOptional({ enum: Status, example: Status.ACTIVE })
  @IsOptional()
  @IsEnum(Status, { message: 'Status must be active or inactive' })
  status?: Status;
}
