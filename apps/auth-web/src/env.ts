import { z } from "zod";

export const env = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    VITE_AUTH_URL: z.string().url().default("http://localhost:3340"),
    VITE_ENABLE_GOOGLE_AUTH: z
      .string()
      .optional()
      .transform((v) => v === "true"),
    VITE_ENABLE_GITHUB_AUTH: z
      .string()
      .optional()
      .transform((v) => v === "true"),
  })
  .parse(import.meta.env);
