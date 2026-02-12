import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserEntity1770811160938 implements MigrationInterface {
    name = 'UpdateUserEntity1770811160938'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "grade" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "grade"`);
    }

}
