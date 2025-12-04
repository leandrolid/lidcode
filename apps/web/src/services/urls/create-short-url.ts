import fetchClient from "@/lib/fetch-client";

export async function createShortUrl(originalUrl: string) {
  return fetchClient<CreateShortUrlResponse>("/v1/urls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ originalUrl }),
  });
}

export type CreateShortUrlResponse = {
  shortUrl: string;
};
