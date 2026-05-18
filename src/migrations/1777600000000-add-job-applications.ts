import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobApplications1777600000000 implements MigrationInterface {
  name = 'AddJobApplications1777600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "job_applications" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "job_id" integer NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "cover_letter" text,
        "applied_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_job_applications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_job_applications_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_job_applications_user_id" ON "job_applications" ("user_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_job_applications_user_job" ON "job_applications" ("user_id", "job_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_job_applications_user_job"`);
    await queryRunner.query(`DROP INDEX "idx_job_applications_user_id"`);
    await queryRunner.query(`DROP TABLE "job_applications"`);
  }
}