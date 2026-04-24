import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tables required by dashboard/home (testimonials) and
 * dashboard/notifications (read status). They were missing from the initial
 * schema, which caused Postgres "relation does not exist" → 500 errors.
 */
export class AddTestimonialsAndNotificationReadStatus1777100000000
  implements MigrationInterface
{
  name = 'AddTestimonialsAndNotificationReadStatus1777100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "testimonials" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "role" character varying NOT NULL,
        "text" text NOT NULL,
        "avatar" character varying,
        "rating" integer NOT NULL DEFAULT 5,
        "isActive" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_testimonials_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_read_status" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "notification_id" character varying NOT NULL,
        "read_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_read_status_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notification_read_status_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_notification_read_status_user_notification"
      ON "notification_read_status" ("user_id", "notification_id")
    `);

    // Baseline testimonials so /dashboard/home works before optional seed runs.
    await queryRunner.query(`
      INSERT INTO "testimonials" ("name", "role", "text", "avatar", "rating", "isActive", "created_at", "updated_at")
      VALUES
        (
          'Amina Rauf',
          'FSc Year 2',
          'Topic-wise drills and past-paper style MCQs made revision much faster before my board exams.',
          NULL,
          5,
          true,
          NOW(),
          NOW()
        ),
        (
          'Omar Siddiqui',
          'MDCAT aspirant',
          'Timed practice on Edura felt close to the real exam pace. Analytics helped me fix weak chapters quickly.',
          NULL,
          5,
          true,
          NOW(),
          NOW()
        ),
        (
          'Hira Tariq',
          'Computer science student',
          'Clear explanations and instant feedback on attempts—exactly what I needed for semester prep.',
          NULL,
          4,
          true,
          NOW(),
          NOW()
        ),
        (
          'Usman Farooq',
          'Career switcher',
          'The jobs board surfaced roles I would have missed elsewhere. Application flow was straightforward.',
          NULL,
          5,
          true,
          NOW(),
          NOW()
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_notification_read_status_user_notification"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_read_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "testimonials"`);
  }
}
