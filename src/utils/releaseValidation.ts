import { z } from "zod";

// ─── Release Validation Schemas ──────────────────────────────────────────────

export const createReleaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  genre: z.string().min(1, "Genre is required").max(100),
  language: z.string().min(1, "Language is required").max(50),
  releaseDate: z.string().datetime().or(z.date()),
  releaseType: z.enum(["single", "ep", "album"]),
  labelName: z.string().min(1, "Label name is required").max(255),
  upc: z.string().optional(),
  externalLinks: z.array(z.string().url("Invalid URL")).optional(),
});

export const updateReleaseSchema = createReleaseSchema.partial();

export const submitReleaseSchema = z.object({
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms",
  }),
  isOriginalContent: z.boolean().refine((val) => val === true, {
    message: "You must confirm original content",
  }),
  containsThirdPartySamples: z.boolean(),
  youtubeCriteriaIds: z
    .array(z.number())
    .min(1, "You must acknowledge the YouTube criteria"),
});

// ─── Track Validation Schemas ────────────────────────────────────────────────

export const uploadTrackSchema = z.object({
  trackTitle: z.string().min(1, "Track title is required").max(255),
  isrc: z.string().optional(),
  lyrics: z.string().optional(),
  featuredArtists: z.string().optional(),
});

// ─── File Validation Schemas ────────────────────────────────────────────────

export const audioFileValidation = z.object({
  mimetype: z.enum(["audio/wav"]),
  size: z.number().max(500 * 1024 * 1024, "Audio file must be less than 500MB"),
  filename: z.string().regex(/\.wav$/i, "File must have .wav extension"),
});

export const artworkFileValidation = z.object({
  mimetype: z.enum(["image/jpeg", "image/png"]),
  size: z.number().max(50 * 1024 * 1024, "Artwork file must be less than 50MB"),
  filename: z.string().regex(/\.(jpg|jpeg|png)$/i, "File must be JPG or PNG"),
});

// Export types
export type CreateReleaseInput = z.infer<typeof createReleaseSchema>;
export type UpdateReleaseInput = z.infer<typeof updateReleaseSchema>;
export type SubmitReleaseInput = z.infer<typeof submitReleaseSchema>;
export type UploadTrackInput = z.infer<typeof uploadTrackSchema>;
export type AudioFileValidation = z.infer<typeof audioFileValidation>;
export type ArtworkFileValidation = z.infer<typeof artworkFileValidation>;
