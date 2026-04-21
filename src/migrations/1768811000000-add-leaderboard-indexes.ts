import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLeaderboardIndexes1768811000000
  implements MigrationInterface
{
  name = 'AddLeaderboardIndexes1768811000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_test_attempts_status_created_user"
      ON "test_attempts" ("status", "created_at", "user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_test_attempts_user_status_created"
      ON "test_attempts" ("user_id", "status", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_role_suspended_coins_id"
      ON "users" ("role", "isSuspended", "total_coins", "id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_users_role_suspended_coins_id"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_test_attempts_user_status_created"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_test_attempts_status_created_user"`
    );
  }
}
