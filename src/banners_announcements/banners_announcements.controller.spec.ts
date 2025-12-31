import { Test, TestingModule } from '@nestjs/testing';
import { BannersAnnouncementsController } from './banners_announcements.controller';
import { BannersAnnouncementsService } from './banners_announcements.service';

describe('BannersAnnouncementsController', () => {
  let controller: BannersAnnouncementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BannersAnnouncementsController],
      providers: [BannersAnnouncementsService],
    }).compile();

    controller = module.get<BannersAnnouncementsController>(
      BannersAnnouncementsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
