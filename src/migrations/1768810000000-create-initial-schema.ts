import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1670000000000 implements MigrationInterface {
  name = 'CreateInitialSchema1670000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
          CREATE TYPE "status_enum" AS ENUM ('active', 'inactive');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          CREATE TYPE "user_role_enum" AS ENUM ('user', 'admin');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_status_enum') THEN
          CREATE TYPE "test_status_enum" AS ENUM ('in_progress', 'completed');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jobs_employment_status_enum') THEN
          CREATE TYPE "jobs_employment_status_enum" AS ENUM ('Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Internship');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jobs_status_enum') THEN
          CREATE TYPE "jobs_status_enum" AS ENUM ('active', 'inactive');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_preferred_candidates_gender_enum') THEN
          CREATE TYPE "job_preferred_candidates_gender_enum" AS ENUM ('Male', 'Female', 'Any');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'banners_announcements_type_enum') THEN
          CREATE TYPE "banners_announcements_type_enum" AS ENUM ('banner', 'announcement');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'past_papers_status_enum') THEN
          CREATE TYPE "past_papers_status_enum" AS ENUM ('active', 'inactive');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "status" "status_enum" NOT NULL DEFAULT 'active',
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "grades" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "status" "status_enum" NOT NULL DEFAULT 'active',
        CONSTRAINT "PK_grades_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subjects" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "status" "status_enum" NOT NULL DEFAULT 'active',
        CONSTRAINT "PK_subjects_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "grade-subjects" (
        "id" SERIAL NOT NULL,
        "grade_id" integer NOT NULL,
        "subject_id" integer NOT NULL,
        CONSTRAINT "UQ_grade_subject_pair" UNIQUE ("grade_id", "subject_id"),
        CONSTRAINT "PK_grade_subjects_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_grade_subject_grade" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_grade_subject_subject" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chapters" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "status" "status_enum" NOT NULL DEFAULT 'active',
        "grade_subject_id" integer,
        CONSTRAINT "PK_chapters_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chapters_grade_subject" FOREIGN KEY ("grade_subject_id") REFERENCES "grade-subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying,
        "image" character varying,
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        "refreshToken" character varying,
        "grade" character varying,
        "isSuspended" boolean NOT NULL DEFAULT false,
        "total_coins" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "faqs" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "visibility" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_faqs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "industries" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        CONSTRAINT "UQ_industries_name" UNIQUE ("name"),
        CONSTRAINT "PK_industries_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "departments" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        CONSTRAINT "UQ_departments_name" UNIQUE ("name"),
        CONSTRAINT "PK_departments_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "locations" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        CONSTRAINT "UQ_locations_name" UNIQUE ("name"),
        CONSTRAINT "PK_locations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "career_levels" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        CONSTRAINT "UQ_career_levels_name" UNIQUE ("name"),
        CONSTRAINT "PK_career_levels_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_category" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "parentId" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exam_category_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exam_category_parent" FOREIGN KEY ("parentId") REFERENCES "exam_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "banners_announcements" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "type" "banners_announcements_type_enum" NOT NULL,
        "activeFrom" TIMESTAMP NOT NULL,
        "activeTill" TIMESTAMP NOT NULL,
        "status" "status_enum" NOT NULL DEFAULT 'active',
        "ctaLink" character varying,
        "image" character varying,
        CONSTRAINT "PK_banners_announcements_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "academic_tests" (
        "id" SERIAL NOT NULL,
        "title" character varying(255) NOT NULL,
        "status" "status_enum" NOT NULL DEFAULT 'active',
        "total_questions" integer NOT NULL,
        "total_duration" integer NOT NULL,
        "parent_test_id" integer,
        "category_id" integer,
        "grade_id" integer,
        "subject_id" integer,
        "chapter_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_academic_tests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tests_parent" FOREIGN KEY ("parent_test_id") REFERENCES "academic_tests"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_tests_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_tests_grade" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_tests_subject" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_tests_chapter" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "questions" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "test_id" integer,
        "correct_option_id" integer,
        CONSTRAINT "PK_questions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_questions_test" FOREIGN KEY ("test_id") REFERENCES "academic_tests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "options" (
        "id" SERIAL NOT NULL,
        "value" character varying(255) NOT NULL,
        "isCorrect" boolean NOT NULL DEFAULT false,
        "question_id" integer NOT NULL,
        CONSTRAINT "PK_options_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_options_question" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "test_attempts" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "test_id" integer,
        "attempt_count" integer NOT NULL DEFAULT 1,
        "start_time" TIMESTAMP NOT NULL,
        "end_time" TIMESTAMP,
        "marks" double precision NOT NULL DEFAULT 0,
        "total_correct" integer NOT NULL DEFAULT 0,
        "total_wrong" integer NOT NULL DEFAULT 0,
        "status" "test_status_enum" NOT NULL DEFAULT 'in_progress',
        "remaining_duration" integer,
        "coins_earned" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_test_attempts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_test_attempts_test" FOREIGN KEY ("test_id") REFERENCES "academic_tests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_answers" (
        "id" SERIAL NOT NULL,
        "test_attempt_id" integer,
        "question_id" integer,
        "selected_option_id" integer,
        "isCorrect" boolean,
        CONSTRAINT "PK_user_answers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_answers_attempt" FOREIGN KEY ("test_attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_answers_question" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attempted_questions" (
        "id" SERIAL NOT NULL,
        "test_attempt_id" integer,
        "question_id" integer,
        "question_order" integer NOT NULL,
        CONSTRAINT "PK_attempted_questions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attempted_questions_attempt" FOREIGN KEY ("test_attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_attempted_questions_question" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "jobs" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "industry_id" integer,
        "department_id" integer,
        "location_id" integer,
        "division" character varying,
        "district" character varying,
        "career_level_id" integer,
        "degree_level" character varying,
        "degree_area" character varying,
        "total_positions" integer NOT NULL,
        "role" character varying,
        "project" character varying,
        "employment_status" "jobs_employment_status_enum" NOT NULL,
        "monthly_salary" numeric(10,2),
        "job_description" text,
        "notes" text,
        "level" character varying,
        "status" "jobs_status_enum" NOT NULL DEFAULT 'active',
        "job_posted" date NOT NULL,
        "last_date_to_apply" date NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jobs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_jobs_industry" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_jobs_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_jobs_location" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_jobs_career_level" FOREIGN KEY ("career_level_id") REFERENCES "career_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_preferred_candidates" (
        "id" SERIAL NOT NULL,
        "job_id" integer NOT NULL,
        "years_of_experience" integer NOT NULL,
        "required_division" character varying,
        "gender" "job_preferred_candidates_gender_enum" NOT NULL DEFAULT 'Any',
        "min_age" integer NOT NULL,
        "max_age" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_job_preferred_job_id" UNIQUE ("job_id"),
        CONSTRAINT "PK_job_preferred_candidates_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_job_preferred_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "saved_jobs" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "job_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_saved_jobs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_saved_jobs_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "past_papers" (
        "id" SERIAL NOT NULL,
        "category_id" integer,
        "board_id" integer,
        "grade_id" integer,
        "subject_id" integer,
        "year" integer NOT NULL,
        "file" text NOT NULL,
        "status" "past_papers_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_past_papers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_past_papers_category" FOREIGN KEY ("category_id") REFERENCES "exam_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_past_papers_board" FOREIGN KEY ("board_id") REFERENCES "exam_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_past_papers_grade" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_past_papers_subject" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "past_papers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "saved_jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_preferred_candidates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attempted_questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_answers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "test_attempts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "options"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "academic_tests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "banners_announcements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_category"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "career_levels"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "locations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "industries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "faqs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chapters"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "grade-subjects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subjects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "grades"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);

    await queryRunner.query(`
      DO $$ BEGIN
        DROP TYPE IF EXISTS "past_papers_status_enum";
        DROP TYPE IF EXISTS "banners_announcements_type_enum";
        DROP TYPE IF EXISTS "job_preferred_candidates_gender_enum";
        DROP TYPE IF EXISTS "jobs_status_enum";
        DROP TYPE IF EXISTS "jobs_employment_status_enum";
        DROP TYPE IF EXISTS "test_status_enum";
        DROP TYPE IF EXISTS "user_role_enum";
        DROP TYPE IF EXISTS "status_enum";
      END $$;
    `);
  }
}
