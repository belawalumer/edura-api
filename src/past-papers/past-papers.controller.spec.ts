import { Test, TestingModule } from '@nestjs/testing';
import { PastPapersController } from './past-papers.controller';
import { PastPapersService } from './past-papers.service';

describe('PastPapersController', () => {
  let controller: PastPapersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PastPapersController],
      providers: [PastPapersService],
    }).compile();

    controller = module.get<PastPapersController>(PastPapersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
