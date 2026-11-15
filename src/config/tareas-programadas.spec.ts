import { tareasProgramadasActivas } from './tareas-programadas';

describe('tareasProgramadasActivas', () => {
  it('no activa las tareas con NODE_ENV=test', () => {
    expect(tareasProgramadasActivas({ NODE_ENV: 'test' })).toBe(false);
  });

  it.each(['development', 'production'])(
    'las activa con NODE_ENV=%s',
    (entorno) => {
      expect(tareasProgramadasActivas({ NODE_ENV: entorno })).toBe(true);
    },
  );
});
