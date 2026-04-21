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
import { TestStatus, UserRole } from 'src/common/enums';
import { PaginationQueryDto } from 'src/common/dto';
import { TestAttempt } from 'src/tests/entities/test_attempt.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepo: Repository<TestAttempt>
  ) {}

  async getMyProfile(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return {
      message: 'Profile retrieved successfully',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        image: user.image ?? null,
        role: user.role,
        grade: user.grade ?? null,
        total_coins: Number(user.total_coins ?? 0),
      },
    };
  }

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

  async updateMyProfile(
    id: number,
    dto: Partial<UpdateAdminDto>,
    imageUrl?: string
  ) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.name = dto.name ?? user.name;
    user.phone = dto.phone ?? user.phone;
    user.email = dto.email ?? user.email;

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
        email: user.email,
        image: user.image ?? null,
        role: user.role,
        grade: user.grade ?? null,
        total_coins: Number(user.total_coins ?? 0),
      },
    };
  }

  async getLeaderboard(
    timeframe: 'all_time' | 'weekly' | 'monthly' = 'all_time',
    limit = 20,
    authUserId?: number
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    if (timeframe === 'all_time') {
      const topUsers = await this.userRepo
        .createQueryBuilder('user')
        .where('user.role = :role', { role: UserRole.USER })
        .andWhere('user.isSuspended = false')
        .orderBy('user.total_coins', 'DESC')
        .addOrderBy('user.id', 'ASC')
        .take(safeLimit)
        .getMany();

      const ranked = topUsers.map((u, index) => ({
        rank: index + 1,
        user_id: u.id,
        name: u.name,
        image: u.image ?? null,
        score: Number(u.total_coins ?? 0),
      }));

      let currentUser: {
        rank: number;
        user_id: number;
        name: string;
        image: string | null;
        score: number;
      } | null = null;

      if (authUserId) {
        const inTop = ranked.find((item) => item.user_id === authUserId);
        if (inTop) {
          currentUser = inTop;
        } else {
          const me = await this.userRepo.findOne({
            where: {
              id: authUserId,
              role: UserRole.USER,
              isSuspended: false,
            },
          });

          if (me) {
            const higherCount = await this.userRepo
              .createQueryBuilder('u')
              .where('u.role = :role', { role: UserRole.USER })
              .andWhere('u.isSuspended = false')
              .andWhere(
                '(u.total_coins > :coins OR (u.total_coins = :coins AND u.id < :id))',
                {
                  coins: Number(me.total_coins ?? 0),
                  id: me.id,
                }
              )
              .getCount();

            currentUser = {
              rank: higherCount + 1,
              user_id: me.id,
              name: me.name,
              image: me.image ?? null,
              score: Number(me.total_coins ?? 0),
            };
          }
        }
      }

      return {
        message: 'Leaderboard retrieved successfully',
        data: {
          timeframe,
          items: ranked,
          currentUser,
        },
      };
    }

    const now = new Date();
    const fromDate = new Date(now);
    if (timeframe === 'weekly') {
      fromDate.setDate(now.getDate() - 7);
    } else {
      fromDate.setDate(now.getDate() - 30);
    }

    const leaderboardQb = this.testAttemptRepo
      .createQueryBuilder('attempt')
      .innerJoin(User, 'user', 'user.id = attempt.user_id')
      .select('attempt.user_id', 'user_id')
      .addSelect('user.name', 'name')
      .addSelect('user.image', 'image')
      .addSelect('COALESCE(SUM(attempt.coins_earned), 0)', 'score')
      .where('attempt.status = :status', { status: TestStatus.COMPLETED })
      .andWhere('attempt.created_at >= :fromDate', { fromDate })
      .andWhere('user.role = :role', { role: UserRole.USER })
      .andWhere('user.isSuspended = false')
      .groupBy('attempt.user_id')
      .addGroupBy('user.name')
      .addGroupBy('user.image')
      .orderBy('score', 'DESC')
      .addOrderBy('attempt.user_id', 'ASC')
      .take(safeLimit);

    const raw = await leaderboardQb.getRawMany<{
      user_id: string;
      name: string;
      image: string | null;
      score: string;
    }>();

    const ranked = raw.map((row, index) => ({
      rank: index + 1,
      user_id: Number(row.user_id),
      name: row.name,
      image: row.image ?? null,
      score: Number(row.score ?? 0),
    }));

    let currentUser: {
      rank: number;
      user_id: number;
      name: string;
      image: string | null;
      score: number;
    } | null = null;

    if (authUserId) {
      const inTop = ranked.find((item) => item.user_id === authUserId);
      if (inTop) {
        currentUser = inTop;
      } else {
        const meAgg = await this.testAttemptRepo
          .createQueryBuilder('attempt')
          .innerJoin(User, 'user', 'user.id = attempt.user_id')
          .select('attempt.user_id', 'user_id')
          .addSelect('user.name', 'name')
          .addSelect('user.image', 'image')
          .addSelect('COALESCE(SUM(attempt.coins_earned), 0)', 'score')
          .where('attempt.status = :status', { status: TestStatus.COMPLETED })
          .andWhere('attempt.created_at >= :fromDate', { fromDate })
          .andWhere('user.role = :role', { role: UserRole.USER })
          .andWhere('user.isSuspended = false')
          .andWhere('attempt.user_id = :authUserId', { authUserId })
          .groupBy('attempt.user_id')
          .addGroupBy('user.name')
          .addGroupBy('user.image')
          .getRawOne<{
            user_id: string;
            name: string;
            image: string | null;
            score: string;
          }>();

        if (meAgg) {
          const score = Number(meAgg.score ?? 0);
          const tieUserId = Number(meAgg.user_id);

          const aggregateQb = this.testAttemptRepo
            .createQueryBuilder('attempt')
            .innerJoin(User, 'user', 'user.id = attempt.user_id')
            .select('attempt.user_id', 'user_id')
            .addSelect('COALESCE(SUM(attempt.coins_earned), 0)', 'score')
            .where('attempt.status = :status', { status: TestStatus.COMPLETED })
            .andWhere('attempt.created_at >= :fromDate', { fromDate })
            .andWhere('user.role = :role', { role: UserRole.USER })
            .andWhere('user.isSuspended = false')
            .groupBy('attempt.user_id');

          const higherCountRow = await this.testAttemptRepo.manager
            .createQueryBuilder()
            .select('COUNT(*)', 'higher_count')
            .from(`(${aggregateQb.getQuery()})`, 'lb')
            .where(
              '(lb.score::numeric > :score OR (lb.score::numeric = :score AND lb.user_id::int < :tieUserId))',
              {
                score,
                tieUserId,
              }
            )
            .setParameters(aggregateQb.getParameters())
            .getRawOne<{ higher_count: string }>();

          const higherCount = Number(higherCountRow?.higher_count ?? 0);
          currentUser = {
            rank: higherCount + 1,
            user_id: tieUserId,
            name: meAgg.name,
            image: meAgg.image ?? null,
            score,
          };
        }
      }
    }

    return {
      message: 'Leaderboard retrieved successfully',
      data: {
        timeframe,
        items: ranked,
        currentUser,
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
