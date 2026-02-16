import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExamCategories1768805958529 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE exam_category
      ADD CONSTRAINT unique_exam_category_name UNIQUE(name)
    `);

    const parentCategories = [
      'Punjab Educational Board',
      'KPK Educational Board',
      'University Past Papers',
      'Class Wise Past Papers',
      'Entry Test',
      'Competitive Exams',
      'Technical Education Exams',
      'Punjab Examination Commission',
    ];

    for (const name of parentCategories) {
      await queryRunner.query(
        `INSERT INTO exam_category (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [name]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const parentCategories = [
      'Punjab Educational Board',
      'KPK Educational Board',
      'University Past Papers',
      'Class Wise Past Papers',
      'Entry Test',
      'Competitive Exams',
      'Technical Education Exams',
      'Punjab Examination Commission',
    ];

    for (const name of parentCategories) {
      await queryRunner.query(`DELETE FROM exam_category WHERE name = $1`, [
        name,
      ]);
    }

    await queryRunner.query(`
      ALTER TABLE exam_category
      DROP CONSTRAINT IF EXISTS unique_exam_category_name
    `);
  }
}
