import { Request, Response } from "express";
import { SiteContent } from "../models/index.ts";
import { uploadFileToS3, deleteFileFromS3, uploadBufferToS3 } from "../utils/s3Uploader.ts";
import fs from "fs";

export const getContentBySection = async (req: Request, res: Response) => {
  try {
    const { section } = req.params;
    const content = await SiteContent.findAll({
      where: { section, isActive: true },
      attributes: { exclude: ["key", "isActive"] },
    });

    // Sort in memory to prevent MySQL "Out of sort memory" error caused by sorting JSON columns
    content.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error("Error fetching site content by section:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch content" });
  }
};

export const getAllContent = async (req: Request, res: Response) => {
  try {
    const content = await SiteContent.findAll({
      attributes: { exclude: ["key", "isActive"] },
    });

    // Sort in memory to prevent MySQL "Out of sort memory" error caused by sorting JSON columns
    content.sort((a, b) => {
      if (a.section < b.section) return -1;
      if (a.section > b.section) return 1;

      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error("Error fetching all site content:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch content" });
  }
};

export const createOrUpdateContent = async (req: Request, res: Response) => {
  try {
    let { section, key, content, isActive } = req.body;

    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch (err) {
        console.error("Failed to parse content JSON string:", err);
      }
    }

    if (!section || !content) {
      return res
        .status(400)
        .json({ success: false, message: "Section and content are required" });
    }

    const processBase64Field = async (base64Str: string) => {
      if (!base64Str || typeof base64Str !== "string" || !base64Str.startsWith("data:")) return base64Str;

      const commaIndex = base64Str.indexOf(',');
      if (commaIndex === -1) return base64Str;

      const header = base64Str.substring(0, commaIndex);
      if (!header.includes("base64")) return base64Str;

      const base64Data = base64Str.substring(commaIndex + 1);

      const typeMatch = header.match(/^data:([^;]+)/);
      const contentType = typeMatch ? typeMatch[1] : "application/octet-stream";

      const buffer = Buffer.from(base64Data, "base64");

      let ext = "bin";
      if (contentType.includes("image/jpeg")) ext = "jpg";
      else if (contentType.includes("image/png")) ext = "png";
      else if (contentType.includes("image/webp")) ext = "webp";
      else if (contentType.includes("image/avif")) ext = "avif";
      else if (contentType.includes("video/mp4")) ext = "mp4";
      else if (contentType.includes("video/webm")) ext = "webm";

      const s3Key = `site-content/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
      try {
        return await uploadBufferToS3(buffer, s3Key, contentType);
      } catch (err) {
        console.error("Failed to upload base64 to S3", err);
        return base64Str;
      }
    };

    const processAllBase64 = async (obj: any): Promise<any> => {
      if (!obj) return obj;

      if (typeof obj === "string") {
        if (obj.startsWith("data:")) {
          return await processBase64Field(obj);
        }
        return obj;
      }

      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          obj[i] = await processAllBase64(obj[i]);
        }
        return obj;
      }

      if (typeof obj === "object" && !(obj instanceof Date) && !Buffer.isBuffer(obj)) {
        for (const key of Object.keys(obj)) {
          obj[key] = await processAllBase64(obj[key]);
        }
        return obj;
      }

      return obj;
    };

    content = await processAllBase64(content);

    if (req.files && Array.isArray(req.files)) {
      let logoFileIndex = 0;

      for (const file of req.files as any[]) {
        let url = `/uploads/site-media/${file.filename}`;

        try {
          const s3Key = `site-content/${Date.now()}-${file.filename}`;
          url = await uploadFileToS3(file.path, s3Key, file.mimetype);

          // Optionally delete the local file after upload
          fs.unlink(file.path, (err) => {
            if (err) console.error("Failed to delete local site content media:", err);
          });
        } catch (uploadError) {
          console.error("Error uploading site content media to S3:", uploadError);
          return res.status(500).json({ success: false, message: "Failed to upload media to S3" });
        }

        if (file.fieldname === "hero_image" || file.fieldname === "about_image" || file.fieldname === "features_image" || file.fieldname === "image") {
          content.imageUrl = url;
        } else if (file.fieldname === "hero_video" || file.fieldname === "video") {
          content.backgroundVideo = url;
        }
        // If frontend appends multiple files to the exact same field name 'logos' or 'images'
        else if (file.fieldname === "logos" || file.fieldname === "images" || file.fieldname === "trusted_logos" || file.fieldname === "logos[]") {
          if (content.logos && content.logos[logoFileIndex]) {
            content.logos[logoFileIndex].image = url;
            logoFileIndex++;
          } else if (content.logos) {
            content.logos.push({ name: "", image: url });
            logoFileIndex++;
          }
        }
        // If frontend specifies the exact index: e.g., 'logo_0', 'image_1', 'trusted_logos_image_2'
        else if (file.fieldname.match(/_(\d+)$/)) {
          const match = file.fieldname.match(/_(\d+)$/);
          if (match) {
            const idx = parseInt(match[1], 10);
            if (content.logos && content.logos[idx]) {
              content.logos[idx].image = url;
            }
          }
        }
        // If frontend specifies the index in brackets: e.g., 'logos[0]', 'logos[1]'
        else if (file.fieldname.match(/\[(\d+)\]/)) {
          const match = file.fieldname.match(/\[(\d+)\]/);
          if (match) {
            const idx = parseInt(match[1], 10);
            if (content.logos && content.logos[idx]) {
              content.logos[idx].image = url;
            }
          }
        }
      }
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

      return res
        .status(200)
        .json({
          success: true,
          message: "Content updated successfully",
          data: responseData,
        });
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

    res
      .status(201)
      .json({
        success: true,
        message: "Content created successfully",
        data: responseData,
      });
  } catch (error) {
    console.error("Error creating/updating site content:", error);
    res.status(500).json({ success: false, message: "Failed to save content" });
  }
};

export const deleteContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const content = await SiteContent.findByPk(id);
    if (!content) {
      return res
        .status(404)
        .json({ success: false, message: "Content not found" });
    }

    await content.destroy();

    // Optional: Try to delete media from S3 if applicable
    try {
      const siteData = typeof content.content === 'string' ? JSON.parse(content.content) : content.content;
      const deleteAllS3Urls = async (obj: any) => {
        if (!obj) return;

        if (typeof obj === "string") {
          // Check if string is an S3 URL (assuming our bucket URLs contain 'http' and 'site-content')
          if (obj.startsWith("http") && obj.includes("site-content")) {
            await deleteFileFromS3(obj);
          }
          return;
        }

        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            await deleteAllS3Urls(obj[i]);
          }
          return;
        }

        if (typeof obj === "object" && !(obj instanceof Date) && !Buffer.isBuffer(obj)) {
          for (const key of Object.keys(obj)) {
            await deleteAllS3Urls(obj[key]);
          }
          return;
        }
      };

      if (siteData) {
        await deleteAllS3Urls(siteData);
      }
    } catch (err) {
      console.error("Error deleting old media from S3:", err);
    }

    res
      .status(200)
      .json({ success: true, message: "Content deleted successfully" });
  } catch (error) {
    console.error("Error deleting site content:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete content" });
  }
};
