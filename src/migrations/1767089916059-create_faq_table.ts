import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFaqTable1767089916059 implements MigrationInterface {
  name = 'CreateFaqTable1767089916059';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "faqs" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "visibility" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2ddf4f2c910f8e8fa2663a67bf0" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "faqs"`);
  }
}
