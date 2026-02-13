import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedIndustriesTable1680000000000 implements MigrationInterface {
  name = 'SeedIndustriesTable1680000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            INSERT INTO "industries" (name) VALUES
            ('Cattle Market'),
            ('Planning and Development Board'),
            ('Information Technology'),
            ('Revenue'),
            ('Services'),
            ('Punjab Govt'),
            ('Punjab Enforcement and Regulatory Authority')
            ON CONFLICT (name) DO NOTHING
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM "industries" WHERE name IN (
                'Cattle Market',
                'Planning and Development Board',
                'Information Technology',
                'Revenue',
                'Services',
                'Punjab Govt',
                'Punjab Enforcement and Regulatory Authority'
            )
        `);
  }
}
