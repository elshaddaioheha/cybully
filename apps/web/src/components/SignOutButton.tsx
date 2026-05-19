"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="ui-secondary-button"
      type="button"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
    >
      <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.9} aria-hidden />
      Sign out
    </button>
  );
}
