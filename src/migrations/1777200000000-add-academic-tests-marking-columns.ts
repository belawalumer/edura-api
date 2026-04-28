import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-question scoring metadata on academic_tests (subject tests, entry tests,
 * and division rows). Defaults match API create(): correct 1, negative 0, skipped 0.
 */
export class AddAcademicTestsMarkingColumns1777200000000
  implements MigrationInterface
{
  name = 'AddAcademicTestsMarkingColumns1777200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "academic_tests"
      ADD COLUMN "correct_marks" numeric(10,4) NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      ALTER TABLE "academic_tests"
      ADD COLUMN "negative_marks" numeric(10,4) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "academic_tests"
      ADD COLUMN "skipped_marks" numeric(10,4) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "academic_tests" DROP COLUMN "skipped_marks"
    `);
    await queryRunner.query(`
      ALTER TABLE "academic_tests" DROP COLUMN "negative_marks"
    `);
    await queryRunner.query(`
      ALTER TABLE "academic_tests" DROP COLUMN "correct_marks"
    `);
  }
}
