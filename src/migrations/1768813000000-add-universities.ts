import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniversities1768813000000 implements MigrationInterface {
  name = 'AddUniversities1768813000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "universities" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "city" character varying NOT NULL,
        CONSTRAINT "UQ_universities_name" UNIQUE ("name"),
        CONSTRAINT "PK_universities_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "university_merits" (
        "id" SERIAL NOT NULL,
        "university_id" integer NOT NULL,
        "degree" character varying NOT NULL,
        "last_year_closing_merit" numeric(5,2) NOT NULL,
        CONSTRAINT "PK_university_merits_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_university_merits_university" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "university_merits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "universities"`);
  }
}
