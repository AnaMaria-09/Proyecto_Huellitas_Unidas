import { Test, TestingModule } from '@nestjs/testing';
import { AutenticacionController } from './autenticacion.controller';
import { AutenticacionService } from './autenticacion.service';
import { AutenticadoGuard } from './guards/autenticado.guard';
import { RolesGuard } from './guards/roles.guard';

describe('AutenticacionController', () => {
  let controller: AutenticacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutenticacionController],
      providers: [{ provide: AutenticacionService, useValue: {} }],
    })
      .overrideGuard(AutenticadoGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AutenticacionController>(AutenticacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
