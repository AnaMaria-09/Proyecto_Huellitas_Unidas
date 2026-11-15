import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuitarFkArchivosMascota1794717925303 implements MigrationInterface {
  name = 'QuitarFkArchivosMascota1794717925303';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "archivos" DROP CONSTRAINT "FK_6b0b35038e8f81862f97bd2dc13"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "archivos" ADD CONSTRAINT "FK_6b0b35038e8f81862f97bd2dc13" FOREIGN KEY ("mascota_id") REFERENCES "mascotas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
