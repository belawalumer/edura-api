import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedLocations1680000000002 implements MigrationInterface {
  name = 'SeedLocations1680000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            INSERT INTO "locations" (name) VALUES
            ('Lahore'),
            ('Islamabad'),
            ('Karachi'),
            ('Rawalpindi'),
            ('Faisalabad'),
            ('Sargodha')
            ON CONFLICT (name) DO NOTHING
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM "locations" WHERE name IN (
                'Lahore',
                'Islamabad',
                'Karachi',
                'Rawalpindi',
                'Faisalabad',
                'Sargodha'
            )
        `);
  }
}
