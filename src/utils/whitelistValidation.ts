import { z } from "zod";

export const createWhitelistSchema = z.object({
  category: z.enum(["SOCIAL_MEDIA", "STREAMING_PLATFORM", "WEBSITE_DOMAIN"]),
  platformName: z.string().min(1, "Platform name is required"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .refine(
      (val) => {
        // Basic domain validation, e.g., spotify.com
        return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
      },
      { message: "Invalid domain format" },
    ),
});

export const toggleWhitelistStatusSchema = z.object({
  isActive: z.boolean(),
});

export const rejectWhitelistSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

export type CreateWhitelistInput = z.infer<typeof createWhitelistSchema>;
export type RejectWhitelistInput = z.infer<typeof rejectWhitelistSchema>;
