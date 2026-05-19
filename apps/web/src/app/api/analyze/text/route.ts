import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/backend";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const text = String(body.text ?? "").trim();
  const targetUserId = String(body.target_user_id ?? body.targetUserId ?? "").trim();

  if (!text || !targetUserId) {
    return NextResponse.json({ error: "Text and target user are required" }, { status: 400 });
  }

  const response = await backendFetch<{ tracking_id: string; status: "accepted" }>("/api/v1/analyze/text", {
    method: "POST",
    body: {
      user_id: session.user.email,
      target_user_id: targetUserId,
      timestamp: new Date().toISOString(),
      text
    }
  });

  return NextResponse.json(response, { status: 202 });
}

