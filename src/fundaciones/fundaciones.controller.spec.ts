import { Test, TestingModule } from '@nestjs/testing';
import { FundacionesController } from './fundaciones.controller';

describe('FundacionesController', () => {
  let controller: FundacionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FundacionesController],
    }).compile();

    controller = module.get<FundacionesController>(FundacionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
