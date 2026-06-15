import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { isModeratorEmail } from "@/lib/env";
import { createClient } from "@/utils/supabase/server";

export type AppSession = {
  accessToken: string | null;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    role: "user" | "moderator";
  };
};

function userDisplayName(user: User): string | null {
  const metadata = user.user_metadata;
  if (metadata && typeof metadata === "object") {
    const fullName = metadata.full_name;
    if (typeof fullName === "string" && fullName.trim()) {
      return fullName.trim();
    }

    const name = metadata.name;
    if (typeof name === "string" && name.trim()) {
      return name.trim();
    }
  }

  if (user.email) {
    return user.email.split("@")[0] ?? null;
  }

  return null;
}

export async function getSession(): Promise<AppSession | null> {
  // Check for mock cookie session first to support immediate offline fallback
  try {
    const cookieStore = cookies();
    const mockCookie = cookieStore.get("cybully_mock_session");
    if (mockCookie && mockCookie.value) {
      const parsed = JSON.parse(mockCookie.value);
      if (parsed && typeof parsed === "object" && parsed.email) {
        return {
          accessToken: "mock-access-token",
          user: {
            id: parsed.id || "mock-user-id",
            email: parsed.email,
            name: parsed.name || parsed.email.split("@")[0],
            role: isModeratorEmail(parsed.email) ? "moderator" : "user"
          }
        };
      }
    }
  } catch (err) {
    console.error("[AUTH] Error checking mock session cookie:", err);
  }

  // Fall back to Supabase auth
  const supabase = createClient();
  let user: User | null = null;
  let userError: any = null;

  try {
    const { data, error } = await supabase.auth.getUser();
    user = data.user;
    userError = error;
  } catch (err) {
    console.error("[SUPABASE AUTH DIAGNOSTIC] Exception in getUser():", err);
    userError = err;
  }

  let session: any = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch (err) {
    console.error("[SUPABASE AUTH DIAGNOSTIC] Exception in getSession():", err);
  }

  if (userError || !user) {
    if (userError) {
      console.error("[SUPABASE AUTH DIAGNOSTIC] getUser() returned error:", {
        message: userError?.message || userError,
        status: userError?.status,
        code: userError?.code
      });
    }
    return null;
  }

  return {
    accessToken: session?.access_token ?? null,
    user: {
      id: user.id,
      email: user.email ?? null,
      name: userDisplayName(user),
      role: isModeratorEmail(user.email) ? "moderator" : "user"
    }
  };
}

