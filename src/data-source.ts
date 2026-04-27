import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }),
  entities: [process.env.NODE_ENV === 'production' ? 'dist/src/**/*.entity.js' : 'src/**/*.entity.ts'],
  migrations: [process.env.NODE_ENV === 'production' ? 'dist/src/migrations/*.js' : 'src/migrations/*.ts'],
  synchronize: false,
});
