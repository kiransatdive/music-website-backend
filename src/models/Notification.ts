import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";
import Artist from "./Artist.js";

export interface NotificationAttributes {
  id: number;
  artistId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationCreationAttributes extends Optional<
  NotificationAttributes,
  "id" | "isRead"
> {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: number;
  public artistId!: number;
  public title!: string;
  public message!: string;
  public type!: string;
  public isRead!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    artistId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "artists",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "general",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "Notifications",
    timestamps: true,
  },
);

Notification.belongsTo(Artist, {
  foreignKey: "artistId",
  as: "artist",
});

export default Notification;
