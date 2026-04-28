import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTestAttemptResultColumns1777300000000
  implements MigrationInterface
{
  name = 'AddTestAttemptResultColumns1777300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "test_attempts"
      ADD COLUMN "completed_time" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "test_attempts"
      ADD COLUMN "total_skipped" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "test_attempts"
      ADD COLUMN "correct_marks" numeric(10,4) NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      ALTER TABLE "test_attempts"
      ADD COLUMN "negative_marks" numeric(10,4) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "test_attempts"
      ADD COLUMN "skipped_marks" numeric(10,4) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "test_attempts"
      ADD COLUMN "time_taken" character varying(32)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "test_attempts" DROP COLUMN "time_taken"
    `);
    await queryRunner.query(`
      ALTER TABLE "test_attempts" DROP COLUMN "skipped_marks"
    `);
    await queryRunner.query(`
      ALTER TABLE "test_attempts" DROP COLUMN "negative_marks"
    `);
    await queryRunner.query(`
      ALTER TABLE "test_attempts" DROP COLUMN "correct_marks"
    `);
    await queryRunner.query(`
      ALTER TABLE "test_attempts" DROP COLUMN "total_skipped"
    `);
    await queryRunner.query(`
      ALTER TABLE "test_attempts" DROP COLUMN "completed_time"
    `);
  }
}
