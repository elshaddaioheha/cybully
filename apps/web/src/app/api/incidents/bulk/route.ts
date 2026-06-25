import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { backendFetch } from "@/lib/backend";
import { getSession } from "@/lib/auth";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (session?.user?.role !== "moderator") {
    return NextResponse.json({ error: "Moderator access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = await backendFetch<any>("/api/v1/incidents/bulk", {
      authToken: session.accessToken,
      method: "PATCH",
      body
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to perform bulk update." },
      { status: 502 }
    );
  }
}
