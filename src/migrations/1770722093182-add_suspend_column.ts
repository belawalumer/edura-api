import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuspendColumn1770722093182 implements MigrationInterface {
    name = 'AddSuspendColumn1770722093182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "isSuspended" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isSuspended"`);
    }

}
