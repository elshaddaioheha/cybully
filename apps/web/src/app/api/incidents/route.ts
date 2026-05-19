import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/backend";
import { getSession } from "@/lib/auth";
import type { IncidentListResponse } from "@/types";

export async function GET(request: Request) {
  const session = await getSession();
  if (session?.user?.role !== "moderator") {
    return NextResponse.json({ error: "Moderator access required" }, { status: 403 });
  }

  const incoming = new URL(request.url);
  const query = new URLSearchParams();
  for (const key of ["severity", "status", "limit", "offset"]) {
    const value = incoming.searchParams.get(key);
    if (value) {
      query.set(key, value);
    }
  }

  const incidents = await backendFetch<IncidentListResponse>("/api/v1/incidents", {
    authToken: session.accessToken,
    query
  });
  return NextResponse.json(incidents);
}
