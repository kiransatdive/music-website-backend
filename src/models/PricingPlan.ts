import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

export interface PricingPlanAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  priceText?: string;
  duration?: string;
  revenueShare?: string;
  buttonText?: string;
  buttonLink?: string;
  features?: any;
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
  public priceText!: string;
  public duration!: string;
  public revenueShare!: string;
  public buttonText!: string;
  public buttonLink!: string;
  public features!: any;
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
    priceText: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    duration: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    revenueShare: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    buttonText: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    buttonLink: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true,
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
