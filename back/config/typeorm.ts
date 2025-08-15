import { registerAs } from '@nestjs/config';
import { config as dotenvconfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvconfig();

const isProd = process.env.NODE_ENV === 'production';

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Nunca sincronizar con datos reales; usa migraciones
  synchronize: false,
  logging: true,

  // En dev usamos TS directo; en prod/dist usamos los JS compilados
  entities: isProd ? ['dist/src/**/*.entity.js'] : ['src/**/*.entity.ts'],
  migrations: isProd ? ['dist/src/migrations/**/*.js'] : ['src/migrations/**/*.ts'],
};

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config);