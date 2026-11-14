import { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearUsuariosYMascotas1794692089498 implements MigrationInterface {
  name = 'CrearUsuariosYMascotas1794692089498';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id" SERIAL NOT NULL, "nombre" character varying(80) NOT NULL, "email" character varying(254) NOT NULL, "password_hash" character varying(100) NOT NULL, "rol" character varying(20) NOT NULL, "estado" character varying(20) NOT NULL DEFAULT 'activo', "nombre_organizacion" character varying(120), "ciudad" character varying(80), "telefono" character varying(20), "verificada" boolean NOT NULL DEFAULT false, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "actualizado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "mascotas" ("id" SERIAL NOT NULL, "fundacion_id" integer NOT NULL, "nombre" character varying(80) NOT NULL, "especie" character varying(10) NOT NULL, "tamano" character varying(10) NOT NULL, "edad_meses" integer NOT NULL, "sexo" character varying(15) NOT NULL, "ciudad" character varying(80) NOT NULL, "descripcion" text, "estado" character varying(15) NOT NULL DEFAULT 'disponible', "creada_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "actualizada_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_26a8496b8728b2350a35f080516" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc224bd8a96884aa75d6fe2e2e" ON "mascotas"  ("fundacion_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d37576c4c5af2129ade5624860" ON "mascotas"  ("estado") `,
    );
    await queryRunner.query(
      `ALTER TABLE "mascotas" ADD CONSTRAINT "FK_fc224bd8a96884aa75d6fe2e2ef" FOREIGN KEY ("fundacion_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mascotas" DROP CONSTRAINT "FK_fc224bd8a96884aa75d6fe2e2ef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d37576c4c5af2129ade5624860"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fc224bd8a96884aa75d6fe2e2e"`,
    );
    await queryRunner.query(`DROP TABLE "mascotas"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
  }
}
