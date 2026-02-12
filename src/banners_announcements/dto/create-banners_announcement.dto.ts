import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUrl,
  IsDateString,
  IsString,
} from 'class-validator';
import { ContentType, Status } from '../../common/enums';

export class CreateBannersAnnouncementDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

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

  @IsOptional()
  @IsString()
  image?: string;
}
