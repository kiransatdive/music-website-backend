import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface AdminAttributes {
  id: number;
  email: string;
  password: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminCreationAttributes
  extends Optional<AdminAttributes, 'id' | 'role'> {}

class Admin
  extends Model<AdminAttributes, AdminCreationAttributes>
  implements AdminAttributes
{
  public id!: number;
  public email!: string;
  public password!: string;
  public role!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'admin',
    },
  },
  {
    sequelize,
    tableName: 'admins',
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ['email'] }],
  },
);

export default Admin;
