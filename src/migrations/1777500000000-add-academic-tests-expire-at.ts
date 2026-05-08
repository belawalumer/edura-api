import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAcademicTestsExpireAt1777500000000 implements MigrationInterface {
  name = 'AddAcademicTestsExpireAt1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "academic_tests"
      ADD COLUMN "expire_at" TIMESTAMP
    `);

    await queryRunner.query(`
      UPDATE "academic_tests"
      SET "expire_at" = NOW() + (FLOOR(RANDOM() * 30) + 1) * INTERVAL '1 day'
      WHERE "expire_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "academic_tests" DROP COLUMN "expire_at"
    `);
  }
}
