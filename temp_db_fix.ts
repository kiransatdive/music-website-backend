import sequelize from "./src/config/database.js";

async function run() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");

    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable("RoyaltyReports");
    
    if (!tableInfo.month) {
      console.log("Adding month column to RoyaltyReports...");
      await queryInterface.addColumn("RoyaltyReports", "month", {
        type: sequelize.Sequelize.DataTypes.STRING,
        allowNull: true,
      });
      console.log("month column added successfully.");
    } else {
      console.log("month column already exists.");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sequelize.close();
  }
}

run();
