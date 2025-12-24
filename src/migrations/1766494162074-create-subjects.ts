import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubjects1766494162074 implements MigrationInterface {
  name = 'CreateSubjects1766494162074';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN "division"`);
    await queryRunner.query(
      `ALTER TABLE "subjects" ADD "status" "public"."status_enum" NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "subjects" ADD "name" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "subjects" ADD "name" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "subjects" ADD "division" boolean`);
  }
}
