import { apiBaseUrl, backendInternalToken } from "@/lib/env";
import { fallbackDb } from "@/lib/fallback-db";

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

  let useFallback = false;
  let response: Response | null = null;
  let fetchError: Error | null = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status >= 500) {
        useFallback = true;
      } else {
        const detail = await response.text();
        throw new Error(`Backend request failed (${response.status}): ${detail}`);
      }
    }
  } catch (err) {
    fetchError = err as Error;
    useFallback = true;
  }

  if (useFallback) {
    console.warn(`[API FALLBACK] Backend unreachable/5xx for ${path}. Using offline fallback. Error:`, fetchError || `HTTP ${response?.status}`);

    const isBulkUpdate = path.startsWith("/api/v1/incidents/bulk");
    const isIncidents = !isBulkUpdate && path.startsWith("/api/v1/incidents");
    const isAlerts = path.startsWith("/api/v1/alerts");
    const isAnalyze = path.startsWith("/api/v1/analyze/text");
    const isNotifications = path.startsWith("/api/v1/notifications");

    if (isAnalyze && options.method === "POST") {
      const body = options.body as any;
      const text = String(body?.text ?? "").trim();
      const targetUserId = String(body?.target_user_id ?? "").trim();
      const userId = String(body?.user_id ?? "fallback-user").trim();

      const res = fallbackDb.analyzeText(text, targetUserId, userId);
      return { ...res, fallback: true } as unknown as T;
    }

    if (isBulkUpdate && options.method === "PATCH") {
      const body = options.body as any;
      let reviewer = { id: "mock-reviewer", email: "pascaladerinola082@gmail.com" as string | null };
      try {
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        if (session?.user) {
          reviewer = { id: session.user.id, email: session.user.email };
        }
      } catch (e) {
        console.error("[API FALLBACK] Failed to resolve session for bulk reviewer logging:", e);
      }
      const res = fallbackDb.bulkUpdateIncidents(body.ids, body.status, body.review_note, reviewer);
      return { items: res, fallback: true } as unknown as T;
    }

    if (isIncidents) {
      const parts = path.split("/");
      const id = parts[4]; // ['', 'api', 'v1', 'incidents', '{id}']
      if (id) {
        if (options.method === "PATCH") {
          const body = options.body as any;
          let reviewer = { id: "mock-reviewer", email: "pascaladerinola082@gmail.com" as string | null };
          try {
            const { getSession } = await import("@/lib/auth");
            const session = await getSession();
            if (session?.user) {
              reviewer = { id: session.user.id, email: session.user.email };
            }
          } catch (e) {
            console.error("[API FALLBACK] Failed to resolve session for reviewer logging:", e);
          }
          const res = fallbackDb.updateIncident(id, body.status, body.review_note, reviewer);
          if (!res) {
            throw new Error(`Fallback incident not found: ${id}`);
          }
          return { ...res, fallback: true } as unknown as T;
        } else {
          const res = fallbackDb.getIncident(id);
          if (!res) {
            throw new Error(`Fallback incident not found: ${id}`);
          }
          return { ...res, fallback: true } as unknown as T;
        }
      } else {
        const res = fallbackDb.listIncidents(options.query);
        return { ...res, fallback: true } as unknown as T;
      }
    }

    if (isAlerts) {
      const res = fallbackDb.listAlerts(options.query);
      return { ...res, fallback: true } as unknown as T;
    }

    if (isNotifications) {
      if (options.method === "PATCH") {
        const parts = path.split("/");
        const id = parts[4]; // ['', 'api', 'v1', 'notifications', '{id}']
        if (id) {
          const res = fallbackDb.markNotificationRead(id);
          return { success: res, fallback: true } as unknown as T;
        }
        throw new Error("Missing notification ID for PATCH");
      } else {
        let userId = "fallback-user";
        try {
          const { getSession } = await import("@/lib/auth");
          const session = await getSession();
          if (session?.user) {
            userId = session.user.id;
          }
        } catch (e) {
          console.error("[API FALLBACK] Failed to resolve session for notifications list:", e);
        }
        const res = fallbackDb.listNotifications(userId);
        return { items: res, fallback: true } as unknown as T;
      }
    }

    throw new Error(`Backend fetch failed and route ${path} not handled by fallback.`);
  }

  return response!.json() as Promise<T>;
}

