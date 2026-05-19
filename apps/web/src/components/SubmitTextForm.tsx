"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function SubmitTextForm() {
  const [targetUserId, setTargetUserId] = useState("");
  const [text, setText] = useState("");
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setTrackingId(null);

    try {
      const response = await fetch("/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: targetUserId, text })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Submission failed");
      }
      setTrackingId(body.tracking_id);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-md border border-line bg-white p-5">
      <div>
        <label htmlFor="target_user_id" className="block text-sm font-medium text-slate-700">
          Target user
        </label>
        <input
          id="target_user_id"
          value={targetUserId}
          onChange={(event) => setTargetUserId(event.target.value)}
          placeholder="target@example.com"
          className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
          required
        />
      </div>
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-slate-700">
          Text to analyze
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={8}
          maxLength={5000}
          className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
          required
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={17} aria-hidden />
          {isSubmitting ? "Submitting" : "Submit for analysis"}
        </button>
        <span className="text-sm text-slate-500">{text.length}/5000</span>
      </div>
      {trackingId ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Accepted. Tracking ID: {trackingId}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}

