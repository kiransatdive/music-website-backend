import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

// Attribute Interfaces

export interface ArtistAttributes {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  label?: string;
  artistLabelName?: string;
  bio?: string;
  genre?: string;
  profileImage?: string;
  socialLinks?: object;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  upiId?: string;
  otp?: string | null;
  isVerified?: boolean;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ArtistCreationAttributes extends Optional<
  ArtistAttributes,
  "id"
> {}

class Artist
  extends Model<ArtistAttributes, ArtistCreationAttributes>
  implements ArtistAttributes
{
  public id!: number;
  public name!: string;
  public email!: string;
  public phone!: string;
  public password!: string;
  public label?: string;
  public artistLabelName?: string;
  public bio?: string;
  public genre?: string;
  public profileImage?: string;
  public socialLinks?: object;
  public accountHolderName?: string;
  public bankName?: string;
  public accountNumber?: string;
  public ifscCode?: string;
  public branchName?: string;
  public upiId?: string;
  public otp?: string | null;
  public isVerified?: boolean;
  public role?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Model Initialization

Artist.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    // Core Identity
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    // Profile
    label: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    artistLabelName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    genre: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    socialLinks: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // Bank / Payment Details
    accountHolderName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    bankName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    accountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ifscCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    branchName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    upiId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Auth / Verification
    otp: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "artist",
    },
  },
  {
    sequelize,
    tableName: "artists",
    timestamps: true,
    underscored: true, // maps camelCase fields → snake_case columns
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        unique: true,
        fields: ["phone"],
      },
    ],
  },
);

// Associations

// Lazy load Release to avoid circular dependencies
// This is defined in Release.ts: Release.belongsTo(Artist)
// Sequelize will automatically create the reverse association

export default Artist;
