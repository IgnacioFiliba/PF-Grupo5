import { registerAs } from '@nestjs/config';
import { config as dotenvconfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvconfig();

const config = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Nunca sincronizar con datos reales; usa migraciones
  dropSchema: false,
  synchronize: true,
  logging: true,

  // En dev usamos TS directo; en prod/dist usamos los JS compilados
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/**/*{.ts,.js}'],
};

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
