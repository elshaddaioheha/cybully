"use client";

import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <section className="w-full max-w-md rounded-md border border-line bg-white p-6">
        <h1 className="text-xl font-semibold text-ink">Sign in to Cybully Safety</h1>
        <p className="mt-2 text-sm text-slate-600">Use the Google account configured for the MVP workspace.</p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/app" })}
          className="focus-ring mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          <LogIn size={17} aria-hidden />
          Continue with Google
        </button>
      </section>
    </main>
  );
}

