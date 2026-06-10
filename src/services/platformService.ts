import Platform from "../models/Platform.ts";

export class PlatformServiceError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "PlatformServiceError";
    this.statusCode = statusCode;
  }
}

export class PlatformService {
  async createPlatform(data: { name: string; isActive?: boolean; logo?: string }): Promise<Platform> {
    const existing = await Platform.findOne({ where: { name: data.name } });
    if (existing) {
      throw new PlatformServiceError("Platform with this name already exists", 400);
    }
    return Platform.create({
      name: data.name,
      isActive: data.isActive !== undefined ? data.isActive : true,
      logo: data.logo || null,
    });
  }

  async getAllPlatforms(): Promise<Platform[]> {
    return Platform.findAll({
      order: [["name", "ASC"]],
    });
  }
}

export default new PlatformService();
