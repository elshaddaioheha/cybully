"use client";

import { signIn } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Login01Icon } from "@hugeicons/core-free-icons";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <section className="ui-card w-full max-w-md">
        <h1 className="ui-section-title">Sign in to Cybully Safety</h1>
        <p className="mt-3 text-base leading-7 text-muted">Use the Google account configured for the MVP workspace.</p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/app" })}
          className="ui-primary-button mt-8"
        >
          <HugeiconsIcon icon={Login01Icon} size={17} strokeWidth={1.9} aria-hidden />
          Continue with Google
        </button>
      </section>
    </main>
  );
}
