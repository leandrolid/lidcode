import { fetchClient } from "@/lib/fetch-client";

export async function deleteUrl(id: number) {
  return fetchClient<void>(`/v1/urls/${id}`, { method: "DELETE" });
}
