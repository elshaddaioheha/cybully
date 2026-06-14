import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase credentials missing in middleware updateSession");
      return response;
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          }
        }
      }
    );

    // Limit getSession to 800ms to guarantee we never hit Vercel's 1.5s Edge limit
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => {
        console.warn("Middleware getSession call timed out after 800ms. Proceeding without refresh.");
        resolve(null);
      }, 800)
    );

    await Promise.race([sessionPromise, timeoutPromise]);
  } catch (error) {
    console.error("Error updating session in middleware:", error);
  }

  return response;
}
