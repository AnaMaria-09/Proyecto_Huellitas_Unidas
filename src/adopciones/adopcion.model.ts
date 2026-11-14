export const ESTADOS_SOLICITUD = ['pendiente', 'aprobada', 'rechazada', 'completada', 'cancelada'] as const;

export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];
