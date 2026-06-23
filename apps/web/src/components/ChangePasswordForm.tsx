"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, SecurityCheckIcon } from "@hugeicons/core-free-icons";

import { createClient } from "@/utils/supabase/client";

type ChangePasswordFormProps = {
  email: string;
  isMock: boolean;
};

export function ChangePasswordForm({ email, isMock }: ChangePasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (password.length < 6) {
      setFeedback({ kind: "error", message: "Password must be at least 6 characters." });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({ kind: "error", message: "Passwords do not match." });
      return;
    }

    setSubmitting(true);

    try {
      if (isMock) {
        // Mock Mode password update
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "Mock password update failed.");
        }
        setFeedback({ kind: "success", message: "Mock password updated successfully!" });
        setPassword("");
        setConfirmPassword("");
      } else {
        // Supabase Mode password update
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          throw new Error(error.message);
        }
        setFeedback({ kind: "success", message: "Password updated successfully in Supabase!" });
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setFeedback({
        kind: "error",
        message: err instanceof Error ? err.message : "Failed to update password."
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 border-t border-line pt-8">
      <h2 className="ui-section-title flex items-center gap-2">
        <HugeiconsIcon icon={SecurityCheckIcon} size={20} strokeWidth={1.9} aria-hidden />
        Change Password
      </h2>
      <p className="mt-2 text-sm text-muted">
        Update your account password. Make sure to choose a strong password of at least 6 characters.
      </p>

      {feedback ? (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-center text-sm font-bold text-white ${
            feedback.kind === "error" ? "bg-danger" : "bg-brand"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <form onSubmit={handlePasswordChange} className="mt-6 max-w-md space-y-4">
        <div>
          <label htmlFor="settings-password" className="ui-label">
            New Password
          </label>
          <input
            id="settings-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ui-input"
            placeholder="At least 6 characters"
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="settings-confirm-password" className="ui-label">
            Confirm New Password
          </label>
          <input
            id="settings-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="ui-input"
            placeholder="Re-enter new password"
            required
            disabled={isSubmitting}
          />
        </div>

        <button type="submit" className="ui-primary-button" disabled={isSubmitting}>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={17} strokeWidth={1.9} aria-hidden />
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
