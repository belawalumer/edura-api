import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Make `users.phone` nullable (but keep the UNIQUE constraint) and introduce
 * `users.countryCode`.
 *
 * The previous schema stored placeholder values like `email-<timestamp>` or
 * `google-<timestamp>` because `phone` was NOT NULL. Once the column is
 * nullable we normalise those placeholders back to NULL so real phone
 * numbers can be compared cleanly on the client/server. Postgres allows
 * multiple NULLs under a UNIQUE constraint, so uniqueness still holds for
 * real phone numbers.
 */
export class AlterUsersPhoneAndCountryCode1777000000000
  implements MigrationInterface
{
  name = 'AlterUsersPhoneAndCountryCode1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop NOT NULL on `phone`.
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "phone" DROP NOT NULL
    `);

    // 2. Add the new nullable `countryCode` column.
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "countryCode" character varying
    `);

    // 3. Clear legacy placeholder phone values like `email-1776950498342`,
    //    `google-...`, etc. The UNIQUE constraint on `phone` still holds
    //    because Postgres treats multiple NULLs as distinct.
    await queryRunner.query(`
      UPDATE "users"
      SET "phone" = NULL
      WHERE "phone" ~ '^(email|google|facebook|apple)-[0-9]+$'
    `);

    // 4. Safety net: make sure the UQ_users_phone constraint exists. If a
    //    previous partial run dropped it, recreate it here.
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_users_phone'
        ) THEN
          ALTER TABLE "users"
          ADD CONSTRAINT "UQ_users_phone" UNIQUE ("phone");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the countryCode column.
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "countryCode"
    `);

    // 2. Restore a NOT NULL value for rows that were normalised to NULL by
    //    generating a unique placeholder that satisfies UQ_users_phone.
    await queryRunner.query(`
      UPDATE "users"
      SET "phone" = CONCAT('email-', EXTRACT(EPOCH FROM NOW())::bigint, '-', "id")
      WHERE "phone" IS NULL
    `);

    // 3. Re-apply NOT NULL.
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "phone" SET NOT NULL
    `);
  }
}
