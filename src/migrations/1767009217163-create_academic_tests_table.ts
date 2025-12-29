import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAcademicTestsTable1767009217163 implements MigrationInterface {
  name = 'CreateAcademicTestsTable1767009217163';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP CONSTRAINT "FK_d7eaaf41b5e88023dc4a4d42d15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP COLUMN "grade_subject_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD "parent_test_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD "grade_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD "subject_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD CONSTRAINT "FK_54af620a6d3acbb13920586e873" FOREIGN KEY ("parent_test_id") REFERENCES "academic_tests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD CONSTRAINT "FK_00830b5bd79219c48638b37ad0e" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD CONSTRAINT "FK_1dc19d23e54c7a49ab232bb3226" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP CONSTRAINT "FK_1dc19d23e54c7a49ab232bb3226"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP CONSTRAINT "FK_00830b5bd79219c48638b37ad0e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP CONSTRAINT "FK_54af620a6d3acbb13920586e873"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP COLUMN "subject_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP COLUMN "grade_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP COLUMN "parent_test_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD "grade_subject_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD CONSTRAINT "FK_d7eaaf41b5e88023dc4a4d42d15" FOREIGN KEY ("grade_subject_id") REFERENCES "grade-subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
