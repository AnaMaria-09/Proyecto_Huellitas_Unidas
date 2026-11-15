import { archivoEntorno } from './archivo-entorno';

describe('archivoEntorno', () => {
  it('usa .env.test con NODE_ENV=test', () => {
    expect(archivoEntorno('test')).toBe('.env.test');
  });

  it.each(['development', 'production'])('usa .env con NODE_ENV=%s', (nodeEnv) => {
    expect(archivoEntorno(nodeEnv)).toBe('.env');
  });
});
