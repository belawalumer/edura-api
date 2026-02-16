import { Module } from '@nestjs/common';
import { CareerLevelsService } from './career-levels.service';
import { CareerLevelsController } from './career-levels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareerLevel } from './entities/career-level.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([CareerLevel]), UserModule],
  controllers: [CareerLevelsController],
  providers: [CareerLevelsService],
})
export class CareerLevelsModule {}
