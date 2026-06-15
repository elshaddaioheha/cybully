import { NextResponse } from "next/server";
import { isModeratorEmail } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // Mock validation rules:
    // 1. Must be in MODERATOR_EMAILS or match user.json (pascaladerinola082@gmail.com)
    // 2. Enforce the password "12345678" as defined in user.json
    const isModerator = isModeratorEmail(email) || email === "pascaladerinola082@gmail.com";
    
    if (isModerator && password === "12345678") {
      const mockSession = {
        id: "mock-user-" + Math.random().toString(36).substring(2, 9),
        email,
        name: email.split("@")[0],
        role: "moderator"
      };

      const response = NextResponse.json({ success: true, user: mockSession });
      
      // Set secure cookie for mock session
      response.cookies.set("cybully_mock_session", JSON.stringify(mockSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });

      console.log(`[AUTH FALLBACK] Successfully established mock session for: ${email}`);
      return response;
    }

    return NextResponse.json({ error: "Invalid email or password. Hint: check MODERATOR_EMAILS and use password '12345678'." }, { status: 401 });
  } catch (error) {
    console.error("[AUTH FALLBACK] Error in mock login route:", error);
    return NextResponse.json({ error: "Internal server error during mock sign-in." }, { status: 500 });
  }
}
