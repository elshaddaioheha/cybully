import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { backendFetch } from "@/lib/backend";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const data = await backendFetch<{ items: any[] }>("/api/v1/notifications", {
      authToken: session.accessToken
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load notifications." },
      { status: 502 }
    );
  }
}
