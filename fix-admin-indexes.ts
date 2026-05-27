import dotenv from 'dotenv';
dotenv.config();
import sequelize from './src/config/database.js';

async function fixAdminIndexes() {
  try {
    const [indexes] = await sequelize.query("SHOW INDEX FROM admins");
    const indexNames = new Set((indexes as any[]).map(idx => idx.Key_name));

    let dropped = 0;
    for (const indexName of indexNames) {
      if (
        indexName !== 'PRIMARY' &&
        indexName !== 'email' &&
        indexName !== 'admins_email'
      ) {
        console.log(`Dropping index ${indexName}...`);
        await sequelize.query(`ALTER TABLE admins DROP INDEX \`${indexName}\``);
        dropped++;
      }
    }
    console.log(`✅ Admin indexes cleaned up successfully! Dropped ${dropped} duplicate keys.`);
  } catch (error) {
    console.error('❌ Error cleaning up admin indexes:', error);
  } finally {
    await sequelize.close();
  }
}

fixAdminIndexes();
