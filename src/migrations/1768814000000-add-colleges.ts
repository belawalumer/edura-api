import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColleges1768814000000 implements MigrationInterface {
  name = 'AddColleges1768814000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "colleges" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "city" character varying NOT NULL,
        CONSTRAINT "UQ_colleges_name" UNIQUE ("name"),
        CONSTRAINT "PK_colleges_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "college_merits" (
        "id" SERIAL NOT NULL,
        "college_id" integer NOT NULL,
        "degree" character varying NOT NULL,
        "last_year_closing_merit" numeric(5,2) NOT NULL,
        CONSTRAINT "PK_college_merits_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_college_merits_college" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "college_merits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "colleges"`);
  }
}
