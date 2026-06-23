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

    // Resolve user.json location dynamically
    const path = require("path");
    const fs = require("fs");
    let mockPassword = "12345678";
    let mockUserEmail = "pascaladerinola082@gmail.com";

    try {
      const cwd = process.cwd();
      const candidates = [
        path.join(cwd, "user.json"),
        path.join(cwd, "../user.json"),
        path.join(cwd, "../../user.json"),
        "c:/Users/HP/Desktop/cybully/user.json"
      ];
      let userJsonPath = "";
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          userJsonPath = p;
          break;
        }
      }
      if (userJsonPath) {
        const raw = fs.readFileSync(userJsonPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.password) mockPassword = String(parsed.password);
        if (parsed.email) mockUserEmail = String(parsed.email).trim().toLowerCase();
      }
    } catch (err) {
      console.warn("[AUTH FALLBACK] Error reading user.json:", err);
    }

    const isModerator = isModeratorEmail(email) || email === mockUserEmail;
    
    if (isModerator && password === mockPassword) {
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

    return NextResponse.json({ error: `Invalid email or password. Hint: check MODERATOR_EMAILS and use password configured for ${email}.` }, { status: 401 });
  } catch (error) {
    console.error("[AUTH FALLBACK] Error in mock login route:", error);
    return NextResponse.json({ error: "Internal server error during mock sign-in." }, { status: 500 });
  }
}
