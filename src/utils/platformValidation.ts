import { z } from "zod";

export const createPlatformSchema = z.object({
  name: z.string().min(1, "Platform name is required").max(100),
  isActive: z.coerce.boolean().optional(),
});
