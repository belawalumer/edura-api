import { Module } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { FaqsController } from './faqs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Faq } from './entities/faq.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Faq, User])],
  controllers: [FaqsController],
  providers: [FaqsService],
})
export class FaqsModule {}
