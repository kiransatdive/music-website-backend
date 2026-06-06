const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('music_database', 'root', 'Pass@123', {
  host: 'localhost',
  dialect: 'mysql'
});

sequelize.query("SELECT * FROM releases WHERE artistId IN (2, 9)")
  .then(([results]) => {
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
