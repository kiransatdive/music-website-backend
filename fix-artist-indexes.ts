import dotenv from 'dotenv';
dotenv.config();
import sequelize from './src/config/database.js';

async function fixArtistIndexes() {
  try {
    const [indexes] = await sequelize.query("SHOW INDEX FROM artists");
    const indexNames = new Set((indexes as any[]).map(idx => idx.Key_name));
    
    let dropped = 0;
    for (const indexName of indexNames) {
      if (
        indexName !== 'PRIMARY' && 
        indexName !== 'email' && 
        indexName !== 'artists_email' &&
        indexName !== 'phone' &&
        indexName !== 'artists_phone'
      ) {
        console.log(`Dropping index ${indexName}...`);
        await sequelize.query(`ALTER TABLE artists DROP INDEX \`${indexName}\``);
        dropped++;
      }
    }
    console.log(`✅ Artist indexes cleaned up successfully! Dropped ${dropped} duplicate keys.`);
  } catch (error) {
    console.error('❌ Error cleaning up artist indexes:', error);
  } finally {
    await sequelize.close();
  }
}

fixArtistIndexes();
