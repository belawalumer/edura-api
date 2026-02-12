import { PartialType } from '@nestjs/swagger';
import { CreateBannersAnnouncementDto } from './create-banners_announcement.dto';

export class UpdateBannersAnnouncementDto extends PartialType(
  CreateBannersAnnouncementDto
) {}
