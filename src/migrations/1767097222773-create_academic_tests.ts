import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAcademicTests1767097222773 implements MigrationInterface {
  name = 'CreateAcademicTests1767097222773';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "academic_tests" DROP COLUMN "isDivision"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "academic_tests" ADD "isDivision" boolean NOT NULL DEFAULT false`,
    );
  }
}
