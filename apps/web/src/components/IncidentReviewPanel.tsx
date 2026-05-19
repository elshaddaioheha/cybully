"use client";

import { CheckCircle2, Flag, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Incident, IncidentStatus } from "@/types";

const actions: Array<{ status: Extract<IncidentStatus, "reviewed" | "dismissed" | "escalated">; label: string; icon: typeof CheckCircle2 }> = [
  { status: "reviewed", label: "Mark reviewed", icon: CheckCircle2 },
  { status: "dismissed", label: "Dismiss", icon: XCircle },
  { status: "escalated", label: "Escalate", icon: Flag }
];

export function IncidentReviewPanel({ incident }: { incident: Incident }) {
  const router = useRouter();
  const [note, setNote] = useState(incident.review_note ?? "");
  const [isSubmitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(status: IncidentStatus) {
    setSubmitting(status);
    setError(null);
    try {
      const response = await fetch(`/api/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, review_note: note || null })
      });
      if (!response.ok) {
        throw new Error("Unable to update incident");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update incident");
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
          const Icon = action.icon;
          return (
            <button
              key={action.status}
              type="button"
              onClick={() => update(action.status)}
              disabled={Boolean(isSubmitting)}
              className="ui-secondary-button"
            >
              <Icon size={16} aria-hidden />
              {isSubmitting === action.status ? "Saving" : action.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-4 rounded-xl bg-danger px-4 py-3 text-center text-base font-bold text-white">{error}</p> : null}
    </section>
  );
}
