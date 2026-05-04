import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRole } from 'src/common/enums';
import {
  ChangePasswordDto,
  SuspendUserDto,
  UpdateAdminDto,
  UpdateUserProfileDto,
} from './dto/user.dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CloudinaryFile } from 'src/common/interceptors/cloudinary-upload-interceptor';
import { ApiConsumes, ApiExcludeEndpoint } from '@nestjs/swagger';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PaginationQueryDto } from 'src/common/dto';
import type { RequestWithUser } from 'src/auth/guard/auth_guard';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  @Get('me')
  getMyProfile(@Req() req: RequestWithUser) {
    const userId = req?.user?.id;
    return this.userService.getMyProfile(Number(userId));
  }

  @Patch('me/profile')
  @UseInterceptors(CloudinaryFile('image', 'image'))
  @ApiConsumes('multipart/form-data')
  async updateMyProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateUserProfileDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const userId = req.user?.id;
    let imageUrl: string | undefined;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadBuffer(
        file.buffer,
        file.originalname
      );
      imageUrl = uploaded.secure_url;
    }

    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.userService.updateMyProfile(userId, dto, imageUrl);
  }

  @Get('leaderboard')
  @Public()
  getLeaderboard(
    @Query('timeframe') timeframe?: 'all_time' | 'weekly' | 'monthly',
    @Query('limit') limit?: string,
    @Query('onlyMe') onlyMe?: string,
    @Req() req?: RequestWithUser
  ) {
    const parsedLimit =
      typeof limit === 'string' && limit.trim() !== ''
        ? Number(limit)
        : undefined;
    const parsedOnlyMe =
      typeof onlyMe === 'string' &&
      ['1', 'true', 'yes'].includes(onlyMe.toLowerCase());
    return this.userService.getLeaderboard(
      timeframe ?? 'all_time',
      parsedLimit ?? 20,
      req?.user?.id,
      parsedOnlyMe
    );
  }

  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Patch(':id/change-password')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePasswordDto
  ) {
    return this.userService.changePassword(id, dto);
  }

  @Patch('admin/:id/profile')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(CloudinaryFile('image', 'image'))
  @ApiConsumes('multipart/form-data')
  @ApiExcludeEndpoint()
  async updateAdminProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    let imageUrl: string | undefined;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadBuffer(
        file.buffer,
        file.originalname
      );
      imageUrl = uploaded.secure_url;
    }

    if (Object.keys(dto).length === 0 && !imageUrl) {
      throw new BadRequestException('Nothing to update');
    }

    return this.userService.updateAdminProfile(id, dto, imageUrl);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  getUsers(
    @Query('role') role: UserRole = UserRole.USER,
    @Query() query: PaginationQueryDto
  ) {
    return this.userService.getUsersByRole(role, query);
  }

  @Patch(':id/suspend')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  blockUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspendUserDto
  ) {
    return this.userService.suspendUser(id, dto.isSuspended);
  }
}
