export function obtenerJwtSecreto(): string {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) {
    throw new Error('La variable de entorno JWT_SECRET no está definida');
  }
  return secreto;
}
