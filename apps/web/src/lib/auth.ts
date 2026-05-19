import type { User } from "@supabase/supabase-js";

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
  const supabase = createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (error || !user) {
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
