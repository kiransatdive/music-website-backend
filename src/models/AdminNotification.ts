import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

export interface AdminNotificationAttributes {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminNotificationCreationAttributes extends Optional<
  AdminNotificationAttributes,
  "id" | "isRead" | "type"
> {}

class AdminNotification
  extends Model<AdminNotificationAttributes, AdminNotificationCreationAttributes>
  implements AdminNotificationAttributes
{
  public id!: number;
  public title!: string;
  public message!: string;
  public type!: string;
  public isRead!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AdminNotification.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
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
    modelName: "AdminNotification",
    tableName: "AdminNotifications",
    timestamps: true,
  },
);

export default AdminNotification;
