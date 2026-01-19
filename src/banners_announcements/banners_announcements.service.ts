import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBannersAnnouncementDto } from './dto/create-banners_announcement.dto';
import { UpdateBannersAnnouncementDto } from './dto/update-banners_announcement.dto';
import { PaginationQueryDto } from 'src/common/dto';
import { BannersAnnouncement } from './entities/banners_announcement.entity';

@Injectable()
export class BannersAnnouncementsService {
  constructor(
    @InjectRepository(BannersAnnouncement)
    private readonly bannersAnnouncementRepo: Repository<BannersAnnouncement>
  ) {}

  async create(createDto: CreateBannersAnnouncementDto) {
    const content = this.bannersAnnouncementRepo.create(createDto);
    const saved = await this.bannersAnnouncementRepo.save(content);

    return {
      message: 'Banner/Announcement created successfully',
      data: saved,
    };
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.bannersAnnouncementRepo
      .createQueryBuilder('content')
      .orderBy('content.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where('content.title ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      message: 'Banners & Announcements retrieved successfully',
      data: {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    };
  }

  async findOne(id: number) {
    const content = await this.bannersAnnouncementRepo.findOne({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(
        `Banner/Announcement with ID ${id} not found`
      );
    }

    return {
      message: 'Banner/Announcement retrieved successfully',
      data: content,
    };
  }

  async update(id: number, updateDto: UpdateBannersAnnouncementDto) {
    const content = await this.bannersAnnouncementRepo.findOne({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(
        `Banner/Announcement with ID ${id} not found`
      );
    }

    Object.assign(content, updateDto);
    const updated = await this.bannersAnnouncementRepo.save(content);

    return {
      message: 'Banner/Announcement updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const content = await this.bannersAnnouncementRepo.findOne({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(
        `Banner/Announcement with ID ${id} not found`
      );
    }

    await this.bannersAnnouncementRepo.remove(content);

    return {
      message: 'Banner/Announcement deleted successfully',
    };
  }
}
