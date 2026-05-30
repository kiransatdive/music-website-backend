import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Pass@123',
    database: 'music_database'
  });

  console.log("Connected to database");

  const [rows] = await connection.query("SHOW INDEX FROM Platforms WHERE Key_name LIKE 'name%'");
  let dropped = 0;
  for (const row of rows) {
    if (row.Key_name !== 'PRIMARY' && row.Key_name !== 'name') {
      console.log('Dropping index', row.Key_name);
      try {
        await connection.query(`ALTER TABLE Platforms DROP INDEX \`${row.Key_name}\``);
        dropped++;
      } catch(e) {
        console.error(e);
      }
    }
  }
  
  if (dropped === 0) {
    console.log("No duplicate indexes found, maybe they are just numbered like Platforms_name_unique, etc.");
    const [allRows] = await connection.query("SHOW INDEX FROM Platforms");
    for (const row of allRows) {
        if (row.Key_name !== 'PRIMARY' && row.Key_name !== 'name') {
            console.log('Dropping index', row.Key_name);
            try {
                await connection.query(`ALTER TABLE Platforms DROP INDEX \`${row.Key_name}\``);
            } catch(e) {
                console.error(e);
            }
        }
    }
  }

  console.log("Done");
  await connection.end();
}

run().catch(console.error);
