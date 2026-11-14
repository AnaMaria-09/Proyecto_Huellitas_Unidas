// Extensión con la que se guarda cada tipo MIME. Para soportar un tipo nuevo basta con agregarlo aquí.
export const EXTENSIONES_POR_TIPO: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
