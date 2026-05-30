import { Request, Response } from "express";
import { Artist } from "../models/index.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";

export const getAllArtists = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const search = req.query.search as string;

    const where: any = { role: "artist" }; // Optional: Ensure we only get artists

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Artist.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password", "otp"] }, // Don't send sensitive info
    });

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Get All Artists Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch artists" });
  }
};

export const deleteArtist = async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id, 10);
    if (isNaN(artistId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid artist ID" });
    }

    const artist = await Artist.findByPk(artistId);

    if (!artist) {
      return res
        .status(404)
        .json({ success: false, message: "Artist not found" });
    }

    await artist.destroy();

    res.status(200).json({
      success: true,
      message: "Artist deleted successfully",
    });
  } catch (error) {
    console.error("Delete Artist Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete artist" });
  }
};

export const updateArtist = async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id, 10);
    if (isNaN(artistId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid artist ID" });
    }

    const artist = await Artist.findByPk(artistId);

    if (!artist) {
      return res
        .status(404)
        .json({ success: false, message: "Artist not found" });
    }

    const updateData = { ...req.body };

    // Prevent overriding restricted fields like id or role if needed, but since it's admin, we allow most.
    delete updateData.id;

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    await artist.update(updateData);

    const updatedArtist = artist.toJSON();
    delete (updatedArtist as any).password;
    delete (updatedArtist as any).otp;

    res.status(200).json({
      success: true,
      message: "Artist updated successfully",
      data: updatedArtist,
    });
  } catch (error) {
    console.error("Update Artist Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update artist" });
  }
};
