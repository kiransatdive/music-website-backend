import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface SiteContentAttributes {
  id: number;
  section: string;
  key?: string;
  content: any;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SiteContentCreationAttributes
  extends Optional<SiteContentAttributes, 'id' | 'key' | 'isActive'> {}

class SiteContent
  extends Model<SiteContentAttributes, SiteContentCreationAttributes>
  implements SiteContentAttributes
{
  public id!: number;
  public section!: string;
  public key?: string;
  public content!: any;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SiteContent.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    section: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    content: {
      type: DataTypes.JSON,
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
    tableName: 'site_contents',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['section', 'key'],
      },
    ],
  },
);

export default SiteContent;
