import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCoinsToDecimal1777400000000 implements MigrationInterface {
  name = 'AlterCoinsToDecimal1777400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "test_attempts"
      ALTER COLUMN "coins_earned" TYPE numeric(10,4)
      USING "coins_earned"::numeric(10,4)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "total_coins" TYPE numeric(10,4)
      USING "total_coins"::numeric(10,4)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "total_coins" TYPE integer
      USING ROUND("total_coins")::integer
    `);
    await queryRunner.query(`
      ALTER TABLE "test_attempts"
      ALTER COLUMN "coins_earned" TYPE integer
      USING ROUND("coins_earned")::integer
    `);
  }
}
