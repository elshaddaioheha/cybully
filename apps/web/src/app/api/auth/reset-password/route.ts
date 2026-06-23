import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Resolve user.json location dynamically
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

    if (!userJsonPath) {
      return NextResponse.json({ error: "Local user.json config file not found. Mock reset failed." }, { status: 404 });
    }

    const raw = fs.readFileSync(userJsonPath, "utf-8");
    const parsed = JSON.parse(raw);

    // Verify it is the mock user email or update email as well
    parsed.password = password;
    if (parsed.email && parsed.email.toLowerCase() === email) {
      // Just update password
    } else {
      parsed.email = email;
    }

    fs.writeFileSync(userJsonPath, JSON.stringify(parsed, null, 4), "utf-8");
    console.log(`[AUTH FALLBACK] Successfully updated mock user.json password for: ${email}`);

    return NextResponse.json({ success: true, message: "Mock password updated successfully." });
  } catch (error) {
    console.error("[AUTH FALLBACK] Error resetting mock password:", error);
    return NextResponse.json({ error: "Internal server error during mock password reset." }, { status: 500 });
  }
}
