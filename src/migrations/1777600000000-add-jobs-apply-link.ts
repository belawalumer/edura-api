import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobsApplyLink1777600000000 implements MigrationInterface {
  name = 'AddJobsApplyLink1777600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD COLUMN "apply_link" TEXT
    `);

    await queryRunner.query(`
      UPDATE "jobs"
      SET "apply_link" = 'https://example.com/apply/edura-job/' || "id"::text
      WHERE "apply_link" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs" DROP COLUMN "apply_link"
    `);
  }
}
