import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";
import Release from "./Release.js";

// Attribute Interfaces

export interface TrackAttributes {
  id: number;
  releaseId: number;
  trackTitle: string;
  audioFile: string;
  duration: number;
  isrc?: string;
  lyrics?: string;
  featuredArtists?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TrackCreationAttributes extends Optional<
  TrackAttributes,
  "id"
> { }

// Track Model

class Track
  extends Model<TrackAttributes, TrackCreationAttributes>
  implements TrackAttributes {
  public id!: number;
  public releaseId!: number;
  public trackTitle!: string;
  public audioFile!: string;
  public duration!: number;
  public isrc?: string;
  public lyrics?: string;
  public featuredArtists?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Track.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    releaseId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "Releases",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    trackTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    audioFile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Duration in seconds",
    },
    isrc: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lyrics: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    featuredArtists: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Track",
    tableName: "Tracks",
    timestamps: true,
  },
);

// Associations

Track.belongsTo(Release, {
  foreignKey: "releaseId",
  as: "release",
});

export default Track;
