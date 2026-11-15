// Las tareas programadas (@Cron) no corren en las pruebas: ScheduleModule solo se registra
// cuando NODE_ENV no es test.
export function tareasProgramadasActivas(env: NodeJS.ProcessEnv): boolean {
  return env.NODE_ENV !== 'test';
}
