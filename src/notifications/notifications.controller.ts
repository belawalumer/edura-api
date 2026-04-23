import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import type { RequestWithUser } from 'src/auth/guard/auth_guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('mark-read')
  async markRead(
    @Req() req: RequestWithUser,
    @Body() body: { notificationId: string },
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    await this.notificationsService.markAsRead(userId, body.notificationId);
    return { message: 'Notification marked as read' };
  }

  @Post('mark-all-read')
  async markAllRead(
    @Req() req: RequestWithUser,
    @Body() body: { notificationIds: string[] },
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    await this.notificationsService.markAllAsRead(userId, body.notificationIds);
    return { message: 'All notifications marked as read' };
  }
}
