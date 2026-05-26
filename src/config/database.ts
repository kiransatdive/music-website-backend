import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME ?? 'music_database',
  process.env.DB_USER ?? 'root',
  process.env.DB_PASSWORD ?? '',
  {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    dialect: 'mysql',
    logging: false,
    define: { timestamps: true },


    pool: {
      max: 10,
      min: 1,
      acquire: 30000,
      idle: 600000,
      evict: 1000,
    },


    dialectOptions: {
      connectTimeout: 60000,
    },
  }
);

export default sequelize;
