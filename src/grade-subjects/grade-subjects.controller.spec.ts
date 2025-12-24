import { Test, TestingModule } from '@nestjs/testing';
import { GradeSubjectsController } from './grade-subjects.controller';
import { GradeSubjectsService } from './grade-subjects.service';

describe('GradeSubjectsController', () => {
  let controller: GradeSubjectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradeSubjectsController],
      providers: [GradeSubjectsService],
    }).compile();

    controller = module.get<GradeSubjectsController>(GradeSubjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
