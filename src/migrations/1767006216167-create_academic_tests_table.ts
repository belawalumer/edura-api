import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAcademicTestsTable1767006216167 implements MigrationInterface {
  name = 'CreateAcademicTestsTable1767006216167';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_0ec96305bea4f106c62138d3249"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_b1f107600ed9ed81aba56edfcea"`,
    );
    await queryRunner.query(
      `CREATE TABLE "academic_tests" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "total_questions" integer NOT NULL, "total_duration" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "category_id" integer, "grade_subject_id" integer, "chapter_id" integer, CONSTRAINT "PK_99701ea2fba00a57e7ee909baad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_b1f107600ed9ed81aba56edfcea" FOREIGN KEY ("test_id") REFERENCES "academic_tests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD CONSTRAINT "FK_14c83ba9568ead870a13bd710b6" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD CONSTRAINT "FK_d7eaaf41b5e88023dc4a4d42d15" FOREIGN KEY ("grade_subject_id") REFERENCES "grade-subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD CONSTRAINT "FK_17847ad389f291cc47894d30852" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP CONSTRAINT "FK_17847ad389f291cc47894d30852"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP CONSTRAINT "FK_d7eaaf41b5e88023dc4a4d42d15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP CONSTRAINT "FK_14c83ba9568ead870a13bd710b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_b1f107600ed9ed81aba56edfcea"`,
    );
    await queryRunner.query(`DROP TABLE "academic_tests"`);
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_b1f107600ed9ed81aba56edfcea" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_0ec96305bea4f106c62138d3249" FOREIGN KEY ("correct_option_id") REFERENCES "options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
