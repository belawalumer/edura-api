import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { PastPapersService } from './past-papers.service';
import { CreatePastPaperDto } from './dto/create-past-paper.dto';
import { UpdatePastPaperDto } from './dto/update-past-paper.dto';
import { PaginationQueryDto } from 'src/common/dto';
import { AuthGuard } from '../auth/guard/auth_guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { ApiConsumes, ApiExcludeEndpoint } from '@nestjs/swagger';
import { CloudinaryFile } from '../common/interceptors/cloudinary-upload-interceptor';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(AuthGuard)
@Controller('past-papers')
export class PastPapersController {
  @Get('public')
  @Public()
  async findPublic(
    @Query() query: PaginationQueryDto,
    @Query('grade_id') gradeId?: string,
    @Query('subject_id') subjectId?: string,
    @Query('board_id') boardId?: string,
    @Query('category_id') categoryId?: string,
    @Query('year') year?: string
  ) {
    return this.pastPapersService.findPublic({
      ...query,
      grade_id: gradeId ? Number(gradeId) : undefined,
      subject_id: subjectId ? Number(subjectId) : undefined,
      board_id: boardId ? Number(boardId) : undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
      year: year ? Number(year) : undefined,
    });
  }

  @Get('public/:id')
  @Public()
  async findPublicOne(@Param('id') id: number) {
    return this.pastPapersService.findPublicOne(Number(id));
  }

  constructor(
    private readonly pastPapersService: PastPapersService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(CloudinaryFile('file', 'raw'))
  @ApiConsumes('multipart/form-data')
  @ApiExcludeEndpoint()
  async create(
    @Body() dto: CreatePastPaperDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const uploaded = await this.cloudinaryService.uploadBuffer(
      file.buffer,
      file.originalname,
      'raw'
    );

    const papersData = {
      ...dto,
      file: uploaded.secure_url,
    };

    return this.pastPapersService.create(papersData);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.pastPapersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async findOne(@Param('id') id: number) {
    return this.pastPapersService.findOne(Number(id));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(CloudinaryFile('file', 'raw'))
  @ApiConsumes('multipart/form-data')
  @ApiExcludeEndpoint()
  async update(
    @Param('id') id: number,
    @Body() dto: UpdatePastPaperDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const papersData: Partial<UpdatePastPaperDto> = { ...dto };

    if (file) {
      const uploaded = await this.cloudinaryService.uploadBuffer(
        file.buffer,
        file.originalname,
        'raw'
      );

      papersData.file = uploaded.secure_url;
    }

    return this.pastPapersService.update(Number(id), papersData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  async remove(@Param('id') id: number) {
    return this.pastPapersService.remove(Number(id));
  }
}
