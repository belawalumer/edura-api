import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { BannersAnnouncementsService } from './banners_announcements.service';
import { CreateBannersAnnouncementDto } from './dto/create-banners_announcement.dto';
import { UpdateBannersAnnouncementDto } from './dto/update-banners_announcement.dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { PaginationQueryDto } from 'src/common/dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiBody, ApiConsumes, ApiExcludeEndpoint } from '@nestjs/swagger';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CloudinaryFile } from 'src/common/interceptors/cloudinary-upload-interceptor';
import { UserRole } from 'src/common/enums';

@UseGuards(AuthGuard)
@Controller('banners-announcements')
export class BannersAnnouncementsController {
  constructor(
    private readonly bannersAnnouncementsService: BannersAnnouncementsService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(CloudinaryFile('banner', 'image'))
  @ApiConsumes('multipart/form-data')
  @ApiExcludeEndpoint()
  async create(
    @Body() dto: CreateBannersAnnouncementDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const uploaded = await this.cloudinaryService.uploadBuffer(
      file.buffer,
      file.originalname
    );

    const bannerData = {
      ...dto,
      image: uploaded.secure_url,
    };

    return this.bannersAnnouncementsService.create(bannerData);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query() query: PaginationQueryDto) {
    return this.bannersAnnouncementsService.findAll(query);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(CloudinaryFile('banner', 'image'))
  @ApiConsumes('multipart/form-data')
  @ApiExcludeEndpoint()
  @ApiBody({ type: UpdateBannersAnnouncementDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBannersAnnouncementDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const bannerData: Partial<UpdateBannersAnnouncementDto> = { ...dto };

    if (file) {
      const uploaded = await this.cloudinaryService.uploadBuffer(
        file.buffer,
        file.originalname
      );

      bannerData.image = uploaded.secure_url;
    }

    return this.bannersAnnouncementsService.update(id, bannerData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannersAnnouncementsService.remove(id);
  }
}
