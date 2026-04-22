import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExamCategories1768805958529 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE exam_category
      ADD CONSTRAINT unique_exam_category_name UNIQUE(name)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE exam_category
      DROP CONSTRAINT IF EXISTS unique_exam_category_name
    `);
  }
}
