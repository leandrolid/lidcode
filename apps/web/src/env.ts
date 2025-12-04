import { z } from "zod";

export const env = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    VITE_SHORTLID_URL: z.url(),
  })
  .parse(import.meta.env);
