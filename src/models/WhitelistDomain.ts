import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";
import Admin from "./Admin.js";
import Artist from "./Artist.js";

export interface WhitelistDomainAttributes {
  id: number;
  category: "SOCIAL_MEDIA" | "STREAMING_PLATFORM" | "WEBSITE_DOMAIN";
  platformName: string;
  domain: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  isActive: boolean;
  artistId?: number;
  adminId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type WhitelistDomainCreationAttributes = Optional<
  WhitelistDomainAttributes,
  "id" | "isActive" | "status"
>;

class WhitelistDomain
  extends Model<WhitelistDomainAttributes, WhitelistDomainCreationAttributes>
  implements WhitelistDomainAttributes
{
  public id!: number;
  public category!: "SOCIAL_MEDIA" | "STREAMING_PLATFORM" | "WEBSITE_DOMAIN";
  public platformName!: string;
  public domain!: string;
  public status!: "PENDING" | "APPROVED" | "REJECTED";
  public rejectionReason?: string | null;
  public isActive!: boolean;
  public artistId?: number;
  public adminId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WhitelistDomain.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM(
        "SOCIAL_MEDIA",
        "STREAMING_PLATFORM",
        "WEBSITE_DOMAIN",
      ),
      allowNull: false,
    },
    platformName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    artistId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "Artists",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    adminId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "Admins",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
  },
  {
    sequelize,
    tableName: "whitelist_domains",
    timestamps: true,
  },
);

// Relationships
WhitelistDomain.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });
WhitelistDomain.belongsTo(Admin, { foreignKey: "adminId", as: "admin" });

export default WhitelistDomain;
