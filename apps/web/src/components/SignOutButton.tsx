"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="ui-secondary-button"
      type="button"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
    >
      <LogOut size={16} aria-hidden />
      Sign out
    </button>
  );
}
