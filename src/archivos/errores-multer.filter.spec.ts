import { traducirMensajeMulter } from './errores-multer.filter';

describe('traducirMensajeMulter', () => {
  it('traduce un mensaje conocido', () => {
    expect(traducirMensajeMulter('File too large')).toBe('El archivo supera el tamaño máximo permitido');
  });

  it('conserva el nombre del campo', () => {
    expect(traducirMensajeMulter('Unexpected file field - fotos')).toBe('Campo de archivo no esperado: fotos');
  });

  it('no toca los mensajes que no son de multer', () => {
    expect(traducirMensajeMulter('Mascota 3 no encontrada')).toBeUndefined();
  });
});
