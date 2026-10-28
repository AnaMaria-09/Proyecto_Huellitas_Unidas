import { Test, TestingModule } from '@nestjs/testing';
import { AutenticacionOpcionalGuard } from '../autenticacion/guards/autenticacion-opcional.guard';
import { AutenticadoGuard } from '../autenticacion/guards/autenticado.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { FundacionesController } from './fundaciones.controller';
import { FundacionesService } from './fundaciones.service';

describe('FundacionesController', () => {
  let controller: FundacionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FundacionesController],
      providers: [{ provide: FundacionesService, useValue: {} }],
    })
      .overrideGuard(AutenticadoGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AutenticacionOpcionalGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FundacionesController>(FundacionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
