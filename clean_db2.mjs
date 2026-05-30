import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Pass@123',
    database: 'music_database'
  });

  console.log("Connected to database");

  const tables = ['admins', 'artists'];
  for (const table of tables) {
      console.log(`Checking table ${table}...`);
      const [rows] = await connection.query(`SHOW INDEX FROM ${table}`);
      
      const counts = {};
      for (const row of rows) {
          if (row.Key_name !== 'PRIMARY') {
              if (row.Key_name.match(/^(email|phone)_\d+$/)) {
                  console.log(`Dropping index ${row.Key_name} from ${table}`);
                  try {
                      await connection.query(`ALTER TABLE ${table} DROP INDEX \`${row.Key_name}\``);
                  } catch(e) {
                      console.error(e);
                  }
              }
          }
      }
  }

  console.log("Done cleaning admins and artists");
  await connection.end();
}

run().catch(console.error);
