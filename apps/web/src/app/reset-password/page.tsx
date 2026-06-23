"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

import { BrandLogo } from "@/components/BrandLogo";
import { createClient } from "@/utils/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockEmail = searchParams?.get("mock_email") || null;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      if (mockEmail) {
        // Mock Mode password update
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: mockEmail, password })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "Mock password reset failed.");
        }
        setSuccess("Your mock password has been updated. Redirecting to sign in...");
        setTimeout(() => {
          router.push("/sign-in");
          router.refresh();
        }, 2000);
      } else {
        // Supabase Mode password update
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        });

        if (updateError) {
          throw new Error(updateError.message);
        }

        setSuccess("Your password has been updated. Redirecting to console...");
        setTimeout(() => {
          router.push("/app");
          router.refresh();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ui-card w-full max-w-md px-6 py-8 sm:px-7 sm:py-9">
      <BrandLogo href="/sign-in" className="mb-6" />

      <h1 className="ui-section-title">Update Password</h1>
      <p className="mt-3 text-base leading-7 text-muted">
        {mockEmail 
          ? `Setting new password for local mock user: ${mockEmail}`
          : "Enter a strong, secure new password for your account."
        }
      </p>

      {error ? (
        <p className="mt-5 rounded-xl bg-danger px-4 py-3 text-center text-sm font-bold text-white">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-5 rounded-xl bg-brand px-4 py-3 text-center text-sm font-bold text-white">
          {success}
        </p>
      ) : null}

      {!success ? (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="ui-label">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="ui-input"
              placeholder="At least 6 characters"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="ui-label">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="ui-input"
              placeholder="Re-enter new password"
              required
              disabled={isSubmitting}
            />
          </div>

          <button type="submit" className="ui-primary-button w-full" disabled={isSubmitting}>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={17} strokeWidth={1.9} aria-hidden />
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      ) : null}
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-8 sm:py-10">
      <Suspense fallback={
        <section className="ui-card w-full max-w-md px-6 py-8 sm:px-7 sm:py-9 text-center">
          <p className="font-bold text-ink">Loading update panel...</p>
        </section>
      }>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
