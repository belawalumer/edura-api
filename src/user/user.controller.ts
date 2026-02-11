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
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRole } from 'src/common/enums';
import {
  ChangePasswordDto,
  SuspendUserDto,
  UpdateAdminDto,
} from './dto/user.dto';
import { AuthGuard } from 'src/auth/guard/auth_guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CloudinaryFile } from 'src/common/interceptors/cloudinary-upload-interceptor';
import { ApiConsumes, ApiExcludeEndpoint } from '@nestjs/swagger';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PaginationQueryDto } from 'src/common/dto';

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
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
  @UseInterceptors(CloudinaryFile('image'))
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

    if (!dto && !imageUrl) {
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
