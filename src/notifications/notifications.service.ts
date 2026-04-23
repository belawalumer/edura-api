import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationReadStatus } from './entities/notification_read_status.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationReadStatus)
    private readonly readStatusRepo: Repository<NotificationReadStatus>,
  ) {}

  async getReadStatus(userId: number, notificationIds: string[]): Promise<Set<string>> {
    if (notificationIds.length === 0) return new Set();

    const statuses = await this.readStatusRepo
      .createQueryBuilder('status')
      .where('status.user_id = :userId', { userId })
      .andWhere('status.notification_id IN (:...ids)', { ids: notificationIds })
      .getMany();

    return new Set(statuses.map((s) => s.notification_id));
  }

  async markAsRead(userId: number, notificationId: string): Promise<void> {
    const existing = await this.readStatusRepo.findOne({
      where: { user_id: userId, notification_id: notificationId },
    });

    if (!existing) {
      await this.readStatusRepo.save({
        user_id: userId,
        notification_id: notificationId,
      });
    }
  }

  async markAllAsRead(userId: number, notificationIds: string[]): Promise<void> {
    for (const id of notificationIds) {
      await this.markAsRead(userId, id);
    }
  }
}