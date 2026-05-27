import WhitelistDomain from "../models/WhitelistDomain.js";
import { ServiceError } from "./artistAuthService.js";
import {
  CreateWhitelistInput,
  RejectWhitelistInput,
} from "../utils/whitelistValidation.js";

export class WhitelistServiceError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "WhitelistServiceError";
    this.statusCode = statusCode;
  }
}

export class WhitelistService {
  async createWhitelistDomain(
    data: CreateWhitelistInput,
    creatorId: number,
  ): Promise<WhitelistDomain> {
    const existing = await WhitelistDomain.findOne({
      where: { domain: data.domain },
    });
    if (existing) {
      throw new WhitelistServiceError(
        "Domain already exists in whitelist",
        400,
      );
    }

    const whitelist = await WhitelistDomain.create({
      ...data,
      status: "PENDING",
      isActive: true,
      artistId: creatorId,
    });

    return whitelist;
  }

  async getWhitelistDomains(options: {
    category?: string;
    search?: string;
    status?: string;
    artistId?: number;
    limit: number;
    offset: number;
  }): Promise<{ rows: WhitelistDomain[]; count: number }> {
    const whereClause: any = {};

    if (options.category) {
      whereClause.category = options.category;
    }

    if (options.status) {
      whereClause.status = options.status;
    }

    if (options.artistId) {
      whereClause.artistId = options.artistId;
    }

    if (options.search) {
      const { Op } = require("sequelize");
      whereClause[Op.or] = [
        { platformName: { [Op.like]: `%${options.search}%` } },
        { domain: { [Op.like]: `%${options.search}%` } },
      ];
    }

    return await WhitelistDomain.findAndCountAll({
      where: whereClause,
      limit: options.limit,
      offset: options.offset,
      order: [["createdAt", "DESC"]],
    });
  }

  async getWhitelistDomain(id: number): Promise<WhitelistDomain> {
    const whitelist = await WhitelistDomain.findByPk(id);
    if (!whitelist) {
      throw new WhitelistServiceError("Whitelist domain not found", 404);
    }
    return whitelist;
  }

  async deleteWhitelistDomain(id: number): Promise<void> {
    const whitelist = await this.getWhitelistDomain(id);
    await whitelist.destroy();
  }

  async toggleStatus(id: number, isActive: boolean): Promise<WhitelistDomain> {
    const whitelist = await this.getWhitelistDomain(id);
    await whitelist.update({ isActive });
    return whitelist;
  }

  async approveDomain(id: number, adminId: number): Promise<WhitelistDomain> {
    const whitelist = await this.getWhitelistDomain(id);
    await whitelist.update({
      status: "APPROVED",
      rejectionReason: null,
      adminId,
    });
    return whitelist;
  }

  async rejectDomain(
    id: number,
    adminId: number,
    rejectionReason: string,
  ): Promise<WhitelistDomain> {
    const whitelist = await this.getWhitelistDomain(id);
    await whitelist.update({
      status: "REJECTED",
      rejectionReason,
      adminId,
    });
    return whitelist;
  }
}

export default new WhitelistService();
