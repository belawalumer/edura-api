import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSavedJobsUnique1768812000000 implements MigrationInterface {
  name = 'AddSavedJobsUnique1768812000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove duplicates first, keeping the earliest record per (user_id, job_id).
    await queryRunner.query(`
      DELETE FROM "saved_jobs" sj
      USING "saved_jobs" dup
      WHERE sj.id > dup.id
        AND sj.user_id = dup.user_id
        AND sj.job_id = dup.job_id
    `);

    await queryRunner.query(`
      ALTER TABLE "saved_jobs"
      ADD CONSTRAINT "UQ_saved_jobs_user_job" UNIQUE ("user_id", "job_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "saved_jobs"
      DROP CONSTRAINT IF EXISTS "UQ_saved_jobs_user_job"
    `);
  }
}
