import { env } from "@/env";

export async function fetchClient<T>(path: string, options: RequestInit) {
  const headers = await getHeaders(options.headers);
  const url = new URL(path, env.VITE_SHORTLID_URL);
  const request = new Request(url, {
    ...options,
    headers,
  });
  const response = await fetch(request);
  if (!response.ok) {
    throw new Error(getMessageByStatusCode(response.status));
  }
  const body = await getBody<T>(response);
  return body;
}

async function getHeaders(headers?: HeadersInit): Promise<HeadersInit> {
  const token = localStorage.getItem("token");
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return headers || {};
}

function getBody<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("Content-Type");
  if (contentType && contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  if (contentType && contentType.includes("text/")) {
    return response.text() as unknown as Promise<T>;
  }
  return response.blob() as unknown as Promise<T>;
}

function getMessageByStatusCode(_statusCode: number, message?: string) {
  return message || "Erro desconhecido";
}

export default fetchClient;
