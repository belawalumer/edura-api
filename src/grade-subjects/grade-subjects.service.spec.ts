import { Test, TestingModule } from '@nestjs/testing';
import { GradeSubjectsService } from './grade-subjects.service';

describe('GradeSubjectsService', () => {
  let service: GradeSubjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradeSubjectsService],
    }).compile();

    service = module.get<GradeSubjectsService>(GradeSubjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
