import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.AWS_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
  },
  forcePathStyle: process.env.AWS_ENDPOINT ? false : false, // DigitalOcean generally supports virtual-hosted style
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

/**
 * Uploads a local file to S3 and returns its public URL
 */
export async function uploadFileToS3(
  localFilePath: string,
  destinationKey: string,
  contentType: string
): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error("AWS_S3_BUCKET_NAME is not configured. Please check your .env file.");
  }

  try {
    const fileContent = await fs.readFile(localFilePath);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: destinationKey,
      Body: fileContent,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Construct the public S3 URL
    const region = process.env.AWS_REGION || "us-east-1";
    let publicUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${destinationKey}`;

    if (process.env.AWS_ENDPOINT) {
      // e.g. AWS_ENDPOINT=https://sgp1.digitaloceanspaces.com
      const endpointUrl = new URL(process.env.AWS_ENDPOINT);
      publicUrl = `${endpointUrl.protocol}//${BUCKET_NAME}.${endpointUrl.host}/${destinationKey}`;
    }

    return publicUrl;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
}

/**
 * Deletes a file from S3 using its full URL or key
 */
export async function deleteFileFromS3(fileUrlOrKey: string): Promise<void> {
  if (!BUCKET_NAME || !fileUrlOrKey) return;

  try {
    let key = fileUrlOrKey;

    // Extract key if a full S3 URL was provided
    if (fileUrlOrKey.startsWith("http")) {
      const urlParts = new URL(fileUrlOrKey);
      key = urlParts.pathname.substring(1); // remove leading slash
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error(`Failed to delete file from S3: ${fileUrlOrKey}`, error);
  }
}
