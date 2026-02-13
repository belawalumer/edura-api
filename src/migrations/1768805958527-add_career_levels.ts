import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCareerLevels1680000000001 implements MigrationInterface {
  name = 'SeedCareerLevels1680000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            INSERT INTO "career_levels" (name) VALUES
            ('Student/Internship'),
            ('Entry Level'),
            ('Mid Career'),
            ('Management'),
            ('Executive Director'),
            ('Senior Management'),
            ('Paid Internship')
            ON CONFLICT (name) DO NOTHING
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM "career_levels" WHERE name IN (
                'Student/Internship',
                'Entry Level',
                'Mid Career',
                'Management',
                'Executive Director',
                'Senior Management',
                'Paid Internship'
            )
        `);
  }
}
