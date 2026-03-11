import { fetchClient } from "@/lib/fetch-client";

export type UrlItem = {
  id: number;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
};

export async function listUrls() {
  return fetchClient<UrlItem[]>("/v1/urls", { method: "GET" });
}
