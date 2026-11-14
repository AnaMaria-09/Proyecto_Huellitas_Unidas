import { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearTokensRefresco1794692826077 implements MigrationInterface {
  name = 'CrearTokensRefresco1794692826077';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tokens_refresco" ("id" SERIAL NOT NULL, "usuario_id" integer NOT NULL, "token_hash" character varying(64) NOT NULL, "expira_en" TIMESTAMP WITH TIME ZONE NOT NULL, "revocado_en" TIMESTAMP WITH TIME ZONE, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_31d9ad0fbd92d69d751cdf6caaf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_be3d8492cdac6509f0b5cc3173" ON "tokens_refresco"  ("usuario_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0471abdd4038ed74365848d89f" ON "tokens_refresco"  ("token_hash") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_refresco" ADD CONSTRAINT "FK_be3d8492cdac6509f0b5cc3173b" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens_refresco" DROP CONSTRAINT "FK_be3d8492cdac6509f0b5cc3173b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0471abdd4038ed74365848d89f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_be3d8492cdac6509f0b5cc3173"`,
    );
    await queryRunner.query(`DROP TABLE "tokens_refresco"`);
  }
}
