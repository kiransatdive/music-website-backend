import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

// Attribute Interfaces
export interface RoyaltyReportAttributes {
  id: number;
  reportName: string; // To group rows from a specific uploaded excel file
  mainLabel: string | null;
  subLabel: string | null;
  records: number | null;
  totalPlays: number | null;
  income: number | null;
  adminExp: number | null;
  royalty: number | null;
  month: string | null;
  stream: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoyaltyReportCreationAttributes extends Optional<
  RoyaltyReportAttributes,
  "id" | "mainLabel" | "subLabel" | "records" | "totalPlays" | "income" | "adminExp" | "royalty" | "month" | "stream"
> { }

// RoyaltyReport Model
class RoyaltyReport
  extends Model<RoyaltyReportAttributes, RoyaltyReportCreationAttributes>
  implements RoyaltyReportAttributes {
  public id!: number;
  public reportName!: string;
  public mainLabel!: string | null;
  public subLabel!: string | null;
  public records!: number | null;
  public totalPlays!: number | null;
  public income!: number | null;
  public adminExp!: number | null;
  public royalty!: number | null;
  public month!: string | null;
  public stream!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RoyaltyReport.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    reportName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mainLabel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subLabel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    records: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalPlays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    income: {
      type: DataTypes.DECIMAL(16, 8),
      allowNull: true,
    },
    adminExp: {
      type: DataTypes.DECIMAL(16, 8),
      allowNull: true,
    },
    royalty: {
      type: DataTypes.DECIMAL(16, 8),
      allowNull: true,
    },
    month: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stream: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "RoyaltyReport",
    tableName: "RoyaltyReports",
    timestamps: true,
  },
);

export default RoyaltyReport;
