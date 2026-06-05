import sequelize from "./src/config/database.js";

async function run() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");

    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable("RoyaltyReports");
    
    if (!tableInfo.stream) {
      console.log("Adding stream column to RoyaltyReports...");
      await queryInterface.addColumn("RoyaltyReports", "stream", {
        type: sequelize.Sequelize.DataTypes.INTEGER,
        allowNull: true,
      });
      console.log("stream column added successfully.");
    } else {
      console.log("stream column already exists.");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sequelize.close();
  }
}

run();
