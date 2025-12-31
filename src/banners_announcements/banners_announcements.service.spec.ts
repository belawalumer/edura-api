import { Test, TestingModule } from '@nestjs/testing';
import { BannersAnnouncementsService } from './banners_announcements.service';

describe('BannersAnnouncementsService', () => {
  let service: BannersAnnouncementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BannersAnnouncementsService],
    }).compile();

    service = module.get<BannersAnnouncementsService>(
      BannersAnnouncementsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
