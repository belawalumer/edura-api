import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { ContentType, Status } from '../../common/enums';

export class CreateBannersAnnouncementDto {
  @IsNotEmpty()
  title: string;

  @IsEnum(ContentType)
  type: ContentType;

  @IsDateString()
  activeFrom: Date;

  @IsDateString()
  activeTill: Date;

  @IsEnum(Status)
  status: Status;

  @IsOptional()
  @IsUrl()
  ctaLink?: string;
}
