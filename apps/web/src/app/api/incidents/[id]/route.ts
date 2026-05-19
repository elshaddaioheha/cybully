import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/backend";
import { getSession } from "@/lib/auth";
import type { Incident } from "@/types";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (session?.user?.role !== "moderator") {
    return NextResponse.json({ error: "Moderator access required" }, { status: 403 });
  }

  const incident = await backendFetch<Incident>(`/api/v1/incidents/${context.params.id}`, {
    authToken: session.accessToken
  });
  return NextResponse.json(incident);
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (session?.user?.role !== "moderator") {
    return NextResponse.json({ error: "Moderator access required" }, { status: 403 });
  }

  const body = await request.json();
  const incident = await backendFetch<Incident>(`/api/v1/incidents/${context.params.id}`, {
    authToken: session.accessToken,
    method: "PATCH",
    body
  });
  return NextResponse.json(incident);
}
