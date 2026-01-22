import { Status } from '../common/enums';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFixedCategories1690000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO categories (name, status) VALUES 
       ('entry tests', '${Status.ACTIVE}'),
       ('subject tests', '${Status.ACTIVE}')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM categories WHERE name IN ('entry tests', 'subject tests')`
    );
  }
}
