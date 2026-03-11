import { createAuthClient } from "better-auth/client";
import { env } from "@/env";

export const authClient = createAuthClient({
  baseURL: env.VITE_AUTH_URL,
  basePath: "/v1/auth",
});
