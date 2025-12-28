import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTestsTable1766734959730 implements MigrationInterface {
  name = 'CreateTestsTable1766734959730';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tests" DROP CONSTRAINT "tests_category_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" DROP CONSTRAINT "tests_subject_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" DROP CONSTRAINT "tests_parent_test_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" DROP COLUMN "duration_minutes"`,
    );
    await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "subject_id"`);
    await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "parent_test_id"`);
    await queryRunner.query(
      `ALTER TABLE "tests" ADD "total_duration" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ADD "grade_subject_id" integer`,
    );
    await queryRunner.query(`ALTER TABLE "tests" ADD "chapter_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "tests" ALTER COLUMN "title" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "tests" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "tests" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ALTER COLUMN "category_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ALTER COLUMN "category_id" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP SEQUENCE "tests_category_id_seq"`);
    await queryRunner.query(
      `ALTER TABLE "tests" ADD CONSTRAINT "FK_13bfe0fc818e4966575f0b83195" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ADD CONSTRAINT "FK_8758186ecd97bb775bd33874654" FOREIGN KEY ("grade_subject_id") REFERENCES "grade-subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ADD CONSTRAINT "FK_afbedfe8aabc966dfbf50c5243f" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tests" DROP CONSTRAINT "FK_afbedfe8aabc966dfbf50c5243f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" DROP CONSTRAINT "FK_8758186ecd97bb775bd33874654"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" DROP CONSTRAINT "FK_13bfe0fc818e4966575f0b83195"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "tests_category_id_seq" OWNED BY "tests"."category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ALTER COLUMN "category_id" SET DEFAULT nextval('"tests_category_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ALTER COLUMN "category_id" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "tests" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "tests" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ALTER COLUMN "title" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "chapter_id"`);
    await queryRunner.query(
      `ALTER TABLE "tests" DROP COLUMN "grade_subject_id"`,
    );
    await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "total_duration"`);
    await queryRunner.query(
      `ALTER TABLE "tests" ADD "parent_test_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ADD "subject_id" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ADD "duration_minutes" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ADD CONSTRAINT "tests_parent_test_id_fkey" FOREIGN KEY ("parent_test_id") REFERENCES "tests"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ADD CONSTRAINT "tests_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests" ADD CONSTRAINT "tests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
