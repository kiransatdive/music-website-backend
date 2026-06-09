import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('music_database', 'root', 'Pass@123', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connection established.');
    
    await sequelize.query('ALTER TABLE pricing_plans ADD COLUMN price_text VARCHAR(100) NULL;');
    await sequelize.query('ALTER TABLE pricing_plans ADD COLUMN duration VARCHAR(255) NULL;');
    await sequelize.query('ALTER TABLE pricing_plans ADD COLUMN revenue_share VARCHAR(100) NULL;');
    await sequelize.query('ALTER TABLE pricing_plans ADD COLUMN button_text VARCHAR(100) NULL;');
    await sequelize.query('ALTER TABLE pricing_plans ADD COLUMN button_link VARCHAR(255) NULL;');
    await sequelize.query('ALTER TABLE pricing_plans ADD COLUMN features JSON NULL;');
    
    console.log('Columns added successfully.');
  } catch (err) {
    console.error('Error altering table:', err);
  } finally {
    await sequelize.close();
  }
}

run();
