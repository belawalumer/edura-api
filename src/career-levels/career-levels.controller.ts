import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CareerLevelsService } from './career-levels.service';
import { CreateCareerLevelDto } from './dto/create-career-level.dto';
import { AuthGuard } from '../auth/guard/auth_guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('career-levels')
export class CareerLevelsController {
  constructor(private readonly careerLevelsService: CareerLevelsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  create(@Body() createCareerLevelDto: CreateCareerLevelDto) {
    return this.careerLevelsService.create(createCareerLevelDto);
  }
}
