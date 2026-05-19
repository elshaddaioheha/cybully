"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium"
      type="button"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
    >
      <LogOut size={16} aria-hidden />
      Sign out
    </button>
  );
}

