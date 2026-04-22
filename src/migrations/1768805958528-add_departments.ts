import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartmentsSchema1680000000003 implements MigrationInterface {
  name = 'AddDepartmentsSchema1680000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SELECT 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SELECT 1`);
  }
}
