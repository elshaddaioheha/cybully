import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { fallbackDb } from "@/lib/fallback-db";

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.email || !session.accessToken) {
    redirect("/sign-in");
  }
  if (fallbackDb.isUserRestricted(session.user.id)) {
    redirect("/restricted");
  }
  return session;
}

export async function requireModerator() {
  const session = await getSession();
  if (!session?.user?.email || !session.accessToken) {
    redirect("/sign-in");
  }
  if (session.user?.role !== "moderator") {
    // If user is restricted but is not moderator, redirect them accordingly.
    // However, moderators are bypasses.
    if (fallbackDb.isUserRestricted(session.user.id)) {
      redirect("/restricted");
    }
    redirect("/app");
  }
  return session;
}
