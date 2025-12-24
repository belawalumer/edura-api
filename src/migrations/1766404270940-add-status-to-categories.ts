import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToCategories1766404270940 implements MigrationInterface {
  name = 'AddStatusToCategories1766404270940';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."status_enum" AS ENUM('active', 'inactive')`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "status" "public"."status_enum" NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "title"`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "title" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "title"`);
    await queryRunner.query(`ALTER TABLE "categories" ADD "title" text`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."status_enum"`);
  }
}
