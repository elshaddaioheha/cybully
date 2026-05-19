"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, SentIcon } from "@hugeicons/core-free-icons";

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
      const raw = await response.text();
      let body: Record<string, unknown> = {};
      if (raw) {
        try {
          body = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          body = { error: raw };
        }
      }
      if (!response.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "Submission failed");
      }
      setTrackingId(typeof body.tracking_id === "string" ? body.tracking_id : null);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="ui-card flex min-h-[640px] flex-col">
        <div>
          <h2 className="ui-section-title">Analyze a message</h2>
          <p className="mt-3 max-w-md text-base leading-7 text-muted">
            Enter a user pair and the message content for the moderation pipeline.
          </p>
        </div>

        <div className="mt-7 space-y-5">
          <div>
            <label htmlFor="target_user_id" className="ui-label">
              Target user
            </label>
            <input
              id="target_user_id"
              value={targetUserId}
              onChange={(event) => setTargetUserId(event.target.value)}
              placeholder="target@example.com"
              className="ui-input"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="text" className="ui-label mb-0">
                Message text
              </label>
              <span className="text-sm font-medium text-muted">{text.length}/5000</span>
            </div>
            <textarea
              id="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={12}
              maxLength={5000}
              placeholder="Paste the message to evaluate"
              className="ui-input mt-2 resize-none"
              required
            />
          </div>
        </div>

        <div className="mt-auto pt-6">
          <button type="submit" disabled={isSubmitting} className="ui-primary-button">
            <HugeiconsIcon icon={SentIcon} size={18} strokeWidth={1.9} aria-hidden />
            {isSubmitting ? "Submitting" : "Submit for analysis"}
          </button>
        </div>
      </form>

      <section className="ui-card">
        <h2 className="ui-section-title">Results and conclusion</h2>

        <div className="mt-5 space-y-5">
          <div className="ui-card-subtle text-center">
            <p className="text-sm font-bold text-ink">API Acceptance Code</p>
            <p className="ui-metric mt-8">{trackingId ? "202" : "--"}</p>
          </div>

          <div className="ui-card-subtle text-center">
            <p className="text-sm font-bold text-ink">Pipeline State</p>
            <div className="mt-8 flex items-center justify-center gap-3 text-5xl font-bold leading-none text-ink">
              <HugeiconsIcon icon={Clock01Icon} size={38} strokeWidth={1.9} aria-hidden />
              {trackingId ? "Queued" : "Ready"}
            </div>
          </div>

          <div className={`ui-alert-block ${error ? "bg-danger" : trackingId ? "bg-success" : "bg-brand"}`}>
            {error ? "Rejected" : trackingId ? "Accepted" : "Standing By"}
          </div>

          {trackingId ? (
            <div className="rounded-xl border border-line bg-white px-4 py-3 text-center text-sm font-medium text-muted">
              Tracking ID: <span className="font-bold text-ink">{trackingId}</span>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl bg-danger px-4 py-3 text-center text-base font-bold text-white">
              {error}
            </div>
          ) : null}

          <div>
            <h3 className="text-2xl font-normal text-ink" style={{ letterSpacing: "-0.02em" }}>
              Signal basis
            </h3>
            <p className="mt-4 text-base leading-7 text-muted">
              Toxicity, insult, identity attack, and recent repetition determine the persisted severity profile.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
