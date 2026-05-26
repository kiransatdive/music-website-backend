import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';
import Artist from './Artist.js';

// Attribute Interfaces

export interface ReleaseAttributes {
  id: number;
  artistId: number;
  title: string;
  genre: string;
  language: string;
  releaseDate: Date;
  releaseType: 'single' | 'ep' | 'album';
  labelName: string;
  upc?: string;
  artwork?: string;
  status: 'draft' | 'uploaded' | 'pending_review' | 'approved' | 'rejected' | 'distributed' | 'live' | 'taken_down';
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReleaseCreationAttributes
  extends Optional<ReleaseAttributes, 'id' | 'status'> { }

// Release Model 

class Release
  extends Model<ReleaseAttributes, ReleaseCreationAttributes>
  implements ReleaseAttributes {
  public id!: number;
  public artistId!: number;
  public title!: string;
  public genre!: string;
  public language!: string;
  public releaseDate!: Date;
  public releaseType!: 'single' | 'ep' | 'album';
  public labelName!: string;
  public upc?: string;
  public artwork?: string;
  public status!: 'draft' | 'uploaded' | 'pending_review' | 'approved' | 'rejected' | 'distributed' | 'live' | 'taken_down';
  public rejectionReason?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Release.init(
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
        model: 'Artists',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    releaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    releaseType: {
      type: DataTypes.ENUM('single', 'ep', 'album'),
      allowNull: false,
    },
    labelName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    upc: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    artwork: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'uploaded', 'pending_review', 'approved', 'rejected', 'distributed', 'live', 'taken_down'),
      allowNull: false,
      defaultValue: 'draft',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Release',
    tableName: 'Releases',
    timestamps: true,
  }
);

// Associations 

Release.belongsTo(Artist, {
  foreignKey: 'artistId',
  as: 'artist',
});

export default Release;
