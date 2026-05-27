import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

export interface YoutubeCriteriaAttributes {
  id: number;
  text: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface YoutubeCriteriaCreationAttributes extends Optional<
  YoutubeCriteriaAttributes,
  "id" | "isActive"
> {}

class YoutubeCriteria
  extends Model<YoutubeCriteriaAttributes, YoutubeCriteriaCreationAttributes>
  implements YoutubeCriteriaAttributes
{
  public id!: number;
  public text!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

YoutubeCriteria.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    text: {
      type: DataTypes.TEXT,
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
    tableName: "youtube_criteria",
    timestamps: true,
    underscored: true,
  },
);

export default YoutubeCriteria;
