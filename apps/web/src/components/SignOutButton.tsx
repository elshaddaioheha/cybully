"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

type SignOutButtonProps = {
  fullWidth?: boolean;
  variant?: "neutral" | "danger";
};

export function SignOutButton({ fullWidth = false, variant = "neutral" }: SignOutButtonProps) {
  const router = useRouter();
  const className =
    variant === "danger"
      ? `focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 ${
          fullWidth ? "w-full" : ""
        }`
      : `ui-secondary-button ${fullWidth ? "w-full" : ""}`;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <button
      className={className}
      type="button"
      onClick={handleSignOut}
    >
      <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.9} aria-hidden />
      Sign out
    </button>
  );
}
