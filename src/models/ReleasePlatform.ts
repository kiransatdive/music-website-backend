import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import Release from './Release.js';
import Platform from './Platform.js';

// Attribute Interfaces

export interface ReleasePlatformAttributes {
  releaseId: number;
  platformId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ReleasePlatform Model 

class ReleasePlatform
  extends Model<ReleasePlatformAttributes>
  implements ReleasePlatformAttributes {
  public releaseId!: number;
  public platformId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ReleasePlatform.init(
  {
    releaseId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      references: {
        model: 'Releases',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    platformId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      references: {
        model: 'Platforms',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'ReleasePlatform',
    tableName: 'ReleasePlatforms',
    timestamps: true,
  }
);

// Associations 

Release.belongsToMany(Platform, {
  through: ReleasePlatform,
  foreignKey: 'releaseId',
  otherKey: 'platformId',
  as: 'platforms',
});

Platform.belongsToMany(Release, {
  through: ReleasePlatform,
  foreignKey: 'platformId',
  otherKey: 'releaseId',
  as: 'releases',
});

export default ReleasePlatform;
