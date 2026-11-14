import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { VariablesEntorno } from '../config/env.model';
import { opcionesPostgres } from './opciones-postgres';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<VariablesEntorno, true>) => ({
        ...opcionesPostgres({
          NODE_ENV: config.get('NODE_ENV', { infer: true }),
          POSTGRES_HOST: config.get('POSTGRES_HOST', { infer: true }),
          POSTGRES_PORT: config.get('POSTGRES_PORT', { infer: true }),
          POSTGRES_DB: config.get('POSTGRES_DB', { infer: true }),
          POSTGRES_USER: config.get('POSTGRES_USER', { infer: true }),
          POSTGRES_PASSWORD: config.get('POSTGRES_PASSWORD', { infer: true }),
        }),
        // Cada módulo registra sus entidades con TypeOrmModule.forFeature.
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
