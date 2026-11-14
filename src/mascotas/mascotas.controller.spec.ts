import { Test, TestingModule } from '@nestjs/testing';
import { AutenticadoGuard } from '../autenticacion/guards/autenticado.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { MascotasController } from './mascotas.controller';
import { MascotasService } from './mascotas.service';

describe('MascotasController', () => {
  let controller: MascotasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MascotasController],
      providers: [{ provide: MascotasService, useValue: {} }],
    })
      .overrideGuard(AutenticadoGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MascotasController>(MascotasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
