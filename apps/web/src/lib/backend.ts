import { apiBaseUrl, backendInternalToken } from "@/lib/env";

type BackendFetchOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  query?: URLSearchParams;
};

export async function backendFetch<T>(path: string, options: BackendFetchOptions = {}): Promise<T> {
  const url = new URL(path, apiBaseUrl());
  if (options.query) {
    options.query.forEach((value, key) => url.searchParams.set(key, value));
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": backendInternalToken()
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Backend request failed (${response.status}): ${detail}`);
  }

  return response.json() as Promise<T>;
}

