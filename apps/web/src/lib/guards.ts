import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.email || !session.accessToken) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireModerator() {
  const session = await requireUser();
  if (session.user?.role !== "moderator") {
    redirect("/app");
  }
  return session;
}
