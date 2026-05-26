import { Request, Response } from 'express';
import { SiteContent } from '../models/index.js';

export const getContentBySection = async (req: Request, res: Response) => {
  try {
    const { section } = req.params;
    const content = await SiteContent.findAll({
      where: { section, isActive: true },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['key', 'isActive'] },
    });

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching site content by section:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch content' });
  }
};

export const getAllContent = async (req: Request, res: Response) => {
  try {
    const content = await SiteContent.findAll({
      order: [['section', 'ASC'], ['createdAt', 'DESC']],
      attributes: { exclude: ['key', 'isActive'] },
    });

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching all site content:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch content' });
  }
};

export const createOrUpdateContent = async (req: Request, res: Response) => {
  try {
    const { section, key, content, isActive } = req.body;

    if (!section || !content) {
      return res.status(400).json({ success: false, message: 'Section and content are required' });
    }

    // Build the query to find existing content
    const whereClause: any = { section };
    if (key) {
      whereClause.key = key;
    } else {
      whereClause.key = null; // Match the default item for this section
    }

    let existingContent = await SiteContent.findOne({ where: whereClause });

    if (existingContent) {
      existingContent.content = content;
      if (isActive !== undefined) existingContent.isActive = isActive;
      await existingContent.save();

      const responseData = existingContent.toJSON() as any;
      delete responseData.key;
      delete responseData.isActive;

      return res.status(200).json({ success: true, message: 'Content updated successfully', data: responseData });
    }

    // Create new content
    const newContent = await SiteContent.create({
      section,
      key: key || null,
      content,
      isActive: isActive !== undefined ? isActive : true,
    });

    const responseData = newContent.toJSON() as any;
    delete responseData.key;
    delete responseData.isActive;

    res.status(201).json({ success: true, message: 'Content created successfully', data: responseData });
  } catch (error) {
    console.error('Error creating/updating site content:', error);
    res.status(500).json({ success: false, message: 'Failed to save content' });
  }
};

export const deleteContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const content = await SiteContent.findByPk(id);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    await content.destroy();
    res.status(200).json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting site content:', error);
    res.status(500).json({ success: false, message: 'Failed to delete content' });
  }
};
