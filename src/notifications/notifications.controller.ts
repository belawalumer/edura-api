import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { Request } from 'express';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('mark-read')
  async markRead(
    @Req() req: Request,
    @Body() body: { notificationId: string },
  ) {
    const userId = req.user?.id;
    await this.notificationsService.markAsRead(userId, body.notificationId);
    return { message: 'Notification marked as read' };
  }

  @Post('mark-all-read')
  async markAllRead(
    @Req() req: Request,
    @Body() body: { notificationIds: string[] },
  ) {
    const userId = req.user?.id;
    await this.notificationsService.markAllAsRead(userId, body.notificationIds);
    return { message: 'All notifications marked as read' };
  }
}