import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { ContentType, Status } from '../../common/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBannersAnnouncementDto {
  @ApiProperty({ example: 'NTS Test' })
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: ContentType, example: ContentType.BANNER })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({ example: '2026-01-20T00:00:00Z' })
  @IsDateString()
  activeFrom: Date;

  @ApiProperty({ example: '2026-01-20T00:00:00Z' })
  @IsDateString()
  activeTill: Date;

  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  @IsEnum(Status)
  status: Status;

  @ApiPropertyOptional({ example: 'https://example.com/feature' })
  @IsOptional()
  @IsUrl()
  ctaLink?: string;
}
