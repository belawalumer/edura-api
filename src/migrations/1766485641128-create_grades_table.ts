import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGradesTable1766485641128 implements MigrationInterface {
  name = 'CreateGradesTable1766485641128';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "grades" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "status" "public"."status_enum" NOT NULL DEFAULT 'active', "category_id" integer, CONSTRAINT "PK_4740fb6f5df2505a48649f1687b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_4d332de8bcc4cc6fedac2f95048" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT "FK_4d332de8bcc4cc6fedac2f95048"`,
    );
    await queryRunner.query(`DROP TABLE "grades"`);
  }
}
