import { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearSolicitudesAdopcion1794715905114 implements MigrationInterface {
  name = 'CrearSolicitudesAdopcion1794715905114';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "solicitudes_adopcion" ("id" SERIAL NOT NULL, "mascota_id" integer NOT NULL, "adoptante_id" integer NOT NULL, "estado" character varying(15) NOT NULL DEFAULT 'pendiente', "mensaje" text NOT NULL, "motivo_rechazo" text, "observaciones" text, "fecha_entrega" TIMESTAMP WITH TIME ZONE, "creada_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "actualizada_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_89fcfe6ea0324e23d5ea5ddeedf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a51cc8a33b46d2b1bc5953409c" ON "solicitudes_adopcion"  ("mascota_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ee4d43ef2e7adc085e38c7796b" ON "solicitudes_adopcion"  ("adoptante_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_921627b4d08c8ff068924d54a8" ON "solicitudes_adopcion"  ("estado") `,
    );
    await queryRunner.query(
      `CREATE TABLE "historial_solicitudes" ("id" SERIAL NOT NULL, "solicitud_id" integer NOT NULL, "estado_anterior" character varying(15), "estado_nuevo" character varying(15) NOT NULL, "usuario_id" integer NOT NULL, "comentario" text, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cd643ac640d98893156990b2815" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aaeb48066886cf7a457033b9f8" ON "historial_solicitudes"  ("solicitud_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes_adopcion" ADD CONSTRAINT "FK_a51cc8a33b46d2b1bc5953409c2" FOREIGN KEY ("mascota_id") REFERENCES "mascotas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes_adopcion" ADD CONSTRAINT "FK_ee4d43ef2e7adc085e38c7796b4" FOREIGN KEY ("adoptante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "historial_solicitudes" ADD CONSTRAINT "FK_aaeb48066886cf7a457033b9f87" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes_adopcion"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "historial_solicitudes" ADD CONSTRAINT "FK_9beb9c2376e3e39a13b11057ef2" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "historial_solicitudes" DROP CONSTRAINT "FK_9beb9c2376e3e39a13b11057ef2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historial_solicitudes" DROP CONSTRAINT "FK_aaeb48066886cf7a457033b9f87"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes_adopcion" DROP CONSTRAINT "FK_ee4d43ef2e7adc085e38c7796b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes_adopcion" DROP CONSTRAINT "FK_a51cc8a33b46d2b1bc5953409c2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aaeb48066886cf7a457033b9f8"`,
    );
    await queryRunner.query(`DROP TABLE "historial_solicitudes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_921627b4d08c8ff068924d54a8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ee4d43ef2e7adc085e38c7796b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a51cc8a33b46d2b1bc5953409c"`,
    );
    await queryRunner.query(`DROP TABLE "solicitudes_adopcion"`);
  }
}
