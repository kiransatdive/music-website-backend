import sequelize from './src/config/database.js';
import Track from './src/models/Track.js';

async function test() {
  await sequelize.authenticate();
  const track = await Track.findOne({ order: [['id', 'DESC']], raw: true });
  console.log('Latest Track from DB:', track);
  process.exit(0);
}

test().catch(console.error);
