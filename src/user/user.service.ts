import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { ChangePasswordDto, UpdateAdminDto } from './dto/user.dto';
import { UserRole } from 'src/common/enums';
import { PaginationQueryDto } from 'src/common/dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async changePassword(id: number, dto: ChangePasswordDto) {
    const { currentPassword, newPassword } = dto;

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Admin not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Invalid current password');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await this.userRepo.save(user);

    return { status: 'success', message: 'Password changed successfully' };
  }

  async updateAdminProfile(id: number, dto: UpdateAdminDto, imageUrl?: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Admin not found');

    user.name = dto.name ?? user.name;
    user.phone = dto.phone ?? user.phone;

    if (imageUrl) {
      user.image = imageUrl;
    }

    await this.userRepo.save(user);

    return {
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        image: user.image,
      },
    };
  }

  async getUsersByRole(role: UserRole, query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.userRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role })
      .orderBy('user.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('user.name ILIKE :search OR user.email ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      message: 'Users retrieved successfully',
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

  async suspendUser(id: number, isSuspended: boolean) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.isSuspended = isSuspended;
    await this.userRepo.save(user);

    return {
      message: isSuspended
        ? `${user.name} suspended successfully`
        : `${user.name} unsuspended successfully`,
    };
  }
}
