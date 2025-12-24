import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGradeSubject1766557759055 implements MigrationInterface {
  name = 'CreateGradeSubject1766557759055';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "grade-subjects" ("id" SERIAL NOT NULL, "grade_id" integer NOT NULL, "subject_id" integer NOT NULL, CONSTRAINT "UQ_041e23cfbe6f4a8e2186a92a720" UNIQUE ("grade_id", "subject_id"), CONSTRAINT "PK_e1d09146d2efbe3dca4e7528287" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade-subjects" ADD CONSTRAINT "FK_d76f984cfde53a086bc9ce9ca3d" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade-subjects" ADD CONSTRAINT "FK_a022844413dd50d013a608349b8" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "grade-subjects" DROP CONSTRAINT "FK_a022844413dd50d013a608349b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade-subjects" DROP CONSTRAINT "FK_d76f984cfde53a086bc9ce9ca3d"`,
    );
    await queryRunner.query(`DROP TABLE "grade-subjects"`);
  }
}
