import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBannersAnnouncementsTable1767087252862 implements MigrationInterface {
  name = 'CreateBannersAnnouncementsTable1767087252862';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."banners_announcements_type_enum" AS ENUM('banner', 'announcement')`,
    );
    await queryRunner.query(
      `CREATE TABLE "banners_announcements" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "type" "public"."banners_announcements_type_enum" NOT NULL, "activeFrom" TIMESTAMP NOT NULL, "activeTill" TIMESTAMP NOT NULL, "status" "public"."status_enum" NOT NULL DEFAULT 'active', "ctaLink" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ccc95b6c24a480a67ee13ef1d40" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "banners_announcements"`);
    await queryRunner.query(
      `DROP TYPE "public"."banners_announcements_type_enum"`,
    );
  }
}
