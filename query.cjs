const { Sequelize, Op } = require('sequelize');
const sequelize = new Sequelize('music_database', 'root', 'Pass@123', {
  host: 'localhost',
  dialect: 'mysql'
});

const RoyaltyReport = sequelize.define('RoyaltyReport', {
  month: Sequelize.STRING,
  income: Sequelize.DECIMAL(16,8),
  mainLabel: Sequelize.STRING,
  subLabel: Sequelize.STRING
}, { tableName: 'RoyaltyReports', timestamps: false });

async function run() {
  const artist = { name: "Kiran Satdive", artistLabelName: null };
  const trimmedName = artist.name.trim();
  const subLabelWhere = { subLabel: { [Op.like]: `%${trimmedName}%` } };

  let targetMainLabel = artist.artistLabelName && artist.artistLabelName.trim() !== "" 
    ? artist.artistLabelName.trim() 
    : null;

  if (!targetMainLabel) {
    const labelCounts = await RoyaltyReport.findAll({
      attributes: ['mainLabel', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: subLabelWhere,
      group: ['mainLabel'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 1,
      raw: true
    });

    if (labelCounts && labelCounts.length > 0 && labelCounts[0].mainLabel) {
      targetMainLabel = labelCounts[0].mainLabel;
    }
  }

  const royaltyWhere = {
    ...subLabelWhere
  };

  if (targetMainLabel) {
    royaltyWhere.mainLabel = { [Op.like]: `%${targetMainLabel}%` };
  }
  
  const monthwiseRevenue = await RoyaltyReport.findAll({
    attributes: [
      "month",
      [sequelize.fn("SUM", sequelize.col("income")), "income"],
    ],
    where: royaltyWhere,
    group: ["month"],
    order: [["month", "ASC"]],
    raw: true,
  });
  console.log(JSON.stringify(monthwiseRevenue, null, 2));
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
