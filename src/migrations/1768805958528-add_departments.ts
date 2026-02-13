import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDepartments1680000000003 implements MigrationInterface {
  name = 'SeedDepartments1680000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            INSERT INTO "departments" (name) VALUES
            ('IT'),
            ('HR'),
            ('Finance'),
            ('Marketing'),
            ('Sales')
            ON CONFLICT (name) DO NOTHING
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM "departments" WHERE name IN (
                'IT',
                'HR',
                'Finance',
                'Marketing',
                'Sales'
            )
        `);
  }
}
