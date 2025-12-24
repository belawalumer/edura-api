import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChapters1766576811851 implements MigrationInterface {
  name = 'CreateChapters1766576811851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chapters" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "status" "public"."status_enum" NOT NULL DEFAULT 'active', "grade_subject_id" integer, CONSTRAINT "PK_a2bbdbb4bdc786fe0cb0fcfc4a0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapters" ADD CONSTRAINT "FK_b5ae6c856571b0ffe138326471c" FOREIGN KEY ("grade_subject_id") REFERENCES "grade-subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chapters" DROP CONSTRAINT "FK_b5ae6c856571b0ffe138326471c"`,
    );
    await queryRunner.query(`DROP TABLE "chapters"`);
  }
}
