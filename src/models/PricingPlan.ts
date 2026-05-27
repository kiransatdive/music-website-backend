import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

export interface PricingPlanAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PricingPlanCreationAttributes extends Optional<
  PricingPlanAttributes,
  "id" | "isActive"
> {}

class PricingPlan
  extends Model<PricingPlanAttributes, PricingPlanCreationAttributes>
  implements PricingPlanAttributes
{
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PricingPlan.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "pricing_plans",
    timestamps: true,
    underscored: true,
  },
);

export default PricingPlan;
