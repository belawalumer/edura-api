import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuestions1766752254136 implements MigrationInterface {
  name = 'CreateQuestions1766752254136';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "options" DROP CONSTRAINT "options_question_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "questions_correct_option_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "questions_test_id_fkey"`,
    );
    await queryRunner.query(`ALTER TABLE "options" DROP COLUMN "is_correct"`);
    await queryRunner.query(
      `ALTER TABLE "options" ADD "isCorrect" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "options" ALTER COLUMN "value" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "options" ALTER COLUMN "question_id" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "title"`);
    await queryRunner.query(
      `ALTER TABLE "questions" ADD "title" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "options" ADD CONSTRAINT "FK_2bdd03245b8cb040130fe16f21d" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_b1f107600ed9ed81aba56edfcea" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_0ec96305bea4f106c62138d3249" FOREIGN KEY ("correct_option_id") REFERENCES "options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_0ec96305bea4f106c62138d3249"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_b1f107600ed9ed81aba56edfcea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "options" DROP CONSTRAINT "FK_2bdd03245b8cb040130fe16f21d"`,
    );
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "title"`);
    await queryRunner.query(
      `ALTER TABLE "questions" ADD "title" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "options" ALTER COLUMN "question_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "options" ALTER COLUMN "value" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "options" DROP COLUMN "isCorrect"`);
    await queryRunner.query(`ALTER TABLE "options" ADD "is_correct" boolean`);
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "questions_correct_option_id_fkey" FOREIGN KEY ("correct_option_id") REFERENCES "options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "options" ADD CONSTRAINT "options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
