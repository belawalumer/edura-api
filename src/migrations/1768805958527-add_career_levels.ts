import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCareerLevelsSchema1680000000001 implements MigrationInterface {
  name = 'AddCareerLevelsSchema1680000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SELECT 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SELECT 1`);
  }
}
