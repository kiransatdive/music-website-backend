import { Request, Response } from 'express';
import { Artist } from '../models/index.js';
import { Op } from 'sequelize';

export const getAllArtists = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const search = req.query.search as string;

    const where: any = { role: 'artist' }; // Optional: Ensure we only get artists

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
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password', 'otp'] } // Don't send sensitive info
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
    console.error('Get All Artists Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch artists' });
  }
};
