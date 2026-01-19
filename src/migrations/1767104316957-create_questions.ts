import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuestions1767104316957 implements MigrationInterface {
  name = 'CreateQuestions1767104316957';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "options" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "questions" ADD "deleted_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "options" DROP COLUMN "deleted_at"`);
  }
}
