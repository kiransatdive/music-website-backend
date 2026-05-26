import sequelize from './src/config/database.js';
import './src/models/index.js';

async function sync() {
  await sequelize.sync({ alter: true });
  console.log('Database synced successfully');
  process.exit(0);
}

sync().catch(console.error);
