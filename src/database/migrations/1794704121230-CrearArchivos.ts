import { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearArchivos1794704121230 implements MigrationInterface {
  name = 'CrearArchivos1794704121230';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "archivos" ("id" SERIAL NOT NULL, "clave" character varying(64) NOT NULL, "nombre_original" character varying(255) NOT NULL, "tipo_mime" character varying(100) NOT NULL, "tamano_bytes" integer NOT NULL, "tipo" character varying(15) NOT NULL, "propietario_id" integer NOT NULL, "mascota_id" integer, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ba12696719ae3232fb19e3b567a" UNIQUE ("clave"), CONSTRAINT "PK_5609463cf53fb524304c926ad2d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_42d47261a9f23cf28046023d3c" ON "archivos"  ("propietario_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b0b35038e8f81862f97bd2dc1" ON "archivos"  ("mascota_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "archivos" ADD CONSTRAINT "FK_42d47261a9f23cf28046023d3cc" FOREIGN KEY ("propietario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "archivos" ADD CONSTRAINT "FK_6b0b35038e8f81862f97bd2dc13" FOREIGN KEY ("mascota_id") REFERENCES "mascotas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "archivos" DROP CONSTRAINT "FK_6b0b35038e8f81862f97bd2dc13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "archivos" DROP CONSTRAINT "FK_42d47261a9f23cf28046023d3cc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b0b35038e8f81862f97bd2dc1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_42d47261a9f23cf28046023d3c"`,
    );
    await queryRunner.query(`DROP TABLE "archivos"`);
  }
}
