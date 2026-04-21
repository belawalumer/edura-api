import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import type { RequestWithUser } from 'src/auth/guard/auth_guard';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin/dashboard')
  async getDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('dashboard/home')
  @Public()
  async getHome() {
    return this.dashboardService.getHomeData();
  }

  @Get('dashboard/progress')
  @UseGuards(AuthGuard)
  async getProgress(@Req() req: RequestWithUser) {
    return this.dashboardService.getUserProgress(Number(req.user?.id));
  }
}
