import { randomUUID } from 'node:crypto';
import { readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AlmacenamientoLocal } from './almacenamiento-local';

async function leerTodo(flujo: Readable): Promise<Buffer> {
  const partes: Buffer[] = [];
  for await (const parte of flujo) {
    partes.push(Buffer.from(parte as Buffer));
  }
  return Buffer.concat(partes);
}

describe('AlmacenamientoLocal', () => {
  let directorio: string;
  let almacenamiento: AlmacenamientoLocal;

  beforeEach(() => {
    directorio = path.join(os.tmpdir(), `huellitas-almacenamiento-${randomUUID()}`);
    almacenamiento = new AlmacenamientoLocal({ directorio });
  });

  afterEach(async () => {
    await rm(directorio, { recursive: true, force: true });
  });

  describe('guardar', () => {
    it('crea el directorio si no existe y guarda con un nombre aleatorio y la extensión del tipo', async () => {
      const { clave } = await almacenamiento.guardar(Buffer.from('contenido'), 'image/png');

      expect(clave).toMatch(/^[0-9a-f-]{36}\.png$/);
      expect(await readdir(directorio)).toEqual([clave]);
    });

    it('genera claves distintas para cada archivo', async () => {
      const primero = await almacenamiento.guardar(Buffer.from('a'), 'application/pdf');
      const segundo = await almacenamiento.guardar(Buffer.from('a'), 'application/pdf');

      expect(primero.clave).not.toBe(segundo.clave);
    });

    it('rechaza un tipo MIME sin extensión conocida', async () => {
      await expect(almacenamiento.guardar(Buffer.from('a'), 'text/html')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('obtener', () => {
    it('devuelve el contenido guardado', async () => {
      const { clave } = await almacenamiento.guardar(Buffer.from('hola huellitas'), 'image/jpeg');

      const contenido = await leerTodo(await almacenamiento.obtener(clave));

      expect(contenido.toString()).toBe('hola huellitas');
    });

    it('lanza NotFoundException si la clave no existe', async () => {
      await expect(almacenamiento.obtener(`${randomUUID()}.png`)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('existe', () => {
    it('indica si el archivo existe', async () => {
      const { clave } = await almacenamiento.guardar(Buffer.from('a'), 'image/webp');

      expect(await almacenamiento.existe(clave)).toBe(true);
      expect(await almacenamiento.existe(`${randomUUID()}.webp`)).toBe(false);
    });
  });

  describe('eliminar', () => {
    it('borra el archivo', async () => {
      const { clave } = await almacenamiento.guardar(Buffer.from('a'), 'image/png');

      await almacenamiento.eliminar(clave);

      expect(await almacenamiento.existe(clave)).toBe(false);
    });

    it('lanza NotFoundException si el archivo no existe', async () => {
      await expect(almacenamiento.eliminar(`${randomUUID()}.png`)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('protección contra path traversal', () => {
    it.each(['..', '../secreto.txt', '..\\secreto.txt', 'sub/archivo.png', 'sub\\archivo.png', 'nulo\0.png', 'a..b.png', ''])(
      'rechaza la clave %p',
      async (clave) => {
        await expect(almacenamiento.obtener(clave)).rejects.toBeInstanceOf(BadRequestException);
        await expect(almacenamiento.existe(clave)).rejects.toBeInstanceOf(BadRequestException);
        await expect(almacenamiento.eliminar(clave)).rejects.toBeInstanceOf(BadRequestException);
      },
    );
  });
});
