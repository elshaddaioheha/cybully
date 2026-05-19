import { apiBaseUrl, backendInternalToken } from "@/lib/env";

type BackendFetchOptions = {
  authToken?: string | null;
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  query?: URLSearchParams;
};

export async function backendFetch<T>(path: string, options: BackendFetchOptions = {}): Promise<T> {
  const url = new URL(path, apiBaseUrl());
  if (options.query) {
    options.query.forEach((value, key) => url.searchParams.set(key, value));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`;
    headers.apikey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  } else {
    headers["X-Internal-Token"] = backendInternalToken();
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Backend request failed (${response.status}): ${detail}`);
  }

  return response.json() as Promise<T>;
}
