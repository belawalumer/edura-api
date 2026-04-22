import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { College } from './entities/college.entity';
import { CollegeMerit } from './entities/college-merit.entity';
import { CollegesController } from './colleges.controller';
import { CollegesService } from './colleges.service';

@Module({
  imports: [TypeOrmModule.forFeature([College, CollegeMerit]), UserModule],
  controllers: [CollegesController],
  providers: [CollegesService],
})
export class CollegesModule {}
