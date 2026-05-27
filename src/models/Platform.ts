import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

// Attribute Interfaces

export interface PlatformAttributes {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlatformCreationAttributes extends Optional<
  PlatformAttributes,
  "id"
> {}

// Platform Model

class Platform
  extends Model<PlatformAttributes, PlatformCreationAttributes>
  implements PlatformAttributes
{
  public id!: number;
  public name!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Platform.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Platform",
    tableName: "Platforms",
    timestamps: true,
  },
);

export default Platform;
