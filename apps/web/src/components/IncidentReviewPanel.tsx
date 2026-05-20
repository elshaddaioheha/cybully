"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle01Icon, Flag01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { Incident, IncidentStatus } from "@/types";

const actions = [
  { status: "reviewed", label: "Mark reviewed", icon: CheckmarkCircle01Icon },
  { status: "dismissed", label: "Dismiss", icon: Cancel01Icon },
  { status: "escalated", label: "Escalate", icon: Flag01Icon }
] as const;

export function IncidentReviewPanel({ incident }: { incident: Incident }) {
  const router = useRouter();
  const [note, setNote] = useState(incident.review_note ?? "");
  const [isSubmitting, setSubmitting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }
    };
  }, []);

  async function update(status: IncidentStatus) {
    setSubmitting(status);
    setFeedback(null);
    try {
      const response = await fetch(`/api/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, review_note: note || null })
      });
      const payload = (await response.json().catch(() => null)) as Partial<Incident> & { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update incident");
      }
      const updatedStatus = payload?.status ?? status;
      const updatedNote = payload?.review_note;
      if (typeof updatedNote === "string" || updatedNote === null) {
        setNote(updatedNote ?? "");
      }
      setFeedback({
        kind: "success",
        message: `Incident marked ${updatedStatus}. Refreshing details...`
      });
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }
      refreshTimer.current = window.setTimeout(() => router.refresh(), 1000);
    } catch (err) {
      setFeedback({
        kind: "error",
        message: err instanceof Error ? err.message : "Unable to update incident"
      });
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <section className="ui-card">
      <h2 className="ui-section-title">Review action</h2>
      <label htmlFor="review_note" className="ui-label mt-6">
        Moderator note
      </label>
      <textarea
        id="review_note"
        rows={5}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="ui-input resize-none"
      />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          return (
            <button
              key={action.status}
              type="button"
              onClick={() => update(action.status)}
              disabled={Boolean(isSubmitting)}
              className="ui-secondary-button"
            >
              <HugeiconsIcon icon={action.icon} size={16} strokeWidth={1.9} aria-hidden />
              {isSubmitting === action.status ? "Saving" : action.label}
            </button>
          );
        })}
      </div>
      {feedback ? (
        <p
          className={
            feedback.kind === "error"
              ? "mt-4 rounded-xl bg-red-600 px-4 py-3 text-center text-base font-bold text-white"
              : "mt-4 rounded-xl bg-brand px-4 py-3 text-center text-base font-bold text-white"
          }
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
