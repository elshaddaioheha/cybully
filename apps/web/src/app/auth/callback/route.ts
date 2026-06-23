import { createClient } from "@/utils/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      }
      console.error("[AUTH CONFIRMATION] Failed to exchange code for session:", error.message);
    } catch (e) {
      console.error("[AUTH CONFIRMATION] Exception during code exchange:", e);
    }
  }

  // Fallback / Error state
  return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=Could not exchange authorization code`);
}
