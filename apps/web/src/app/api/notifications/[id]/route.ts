import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { backendFetch } from "@/lib/backend";
import { getSession } from "@/lib/auth";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const data = await backendFetch<any>(`/api/v1/notifications/${context.params.id}`, {
      authToken: session.accessToken,
      method: "PATCH"
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update notification." },
      { status: 502 }
    );
  }
}
