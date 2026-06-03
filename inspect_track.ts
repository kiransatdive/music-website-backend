import sequelize from './src/config/database.js';
import Track from './src/models/Track.js';

async function test() {
  await sequelize.authenticate();
  const track = await Track.findByPk(39, { raw: true });
  console.log('Raw Track 39 from DB:', track);
  process.exit(0);
}

test().catch(console.error);
