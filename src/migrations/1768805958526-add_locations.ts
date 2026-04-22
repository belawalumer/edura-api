import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationsSchema1680000000002 implements MigrationInterface {
  name = 'AddLocationsSchema1680000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SELECT 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SELECT 1`);
  }
}
