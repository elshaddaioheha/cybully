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
    <section className="rounded-md border border-line bg-white p-5">
      <h2 className="text-base font-semibold text-ink">Review action</h2>
      <label htmlFor="review_note" className="mt-4 block text-sm font-medium text-slate-700">
        Moderator note
      </label>
      <textarea
        id="review_note"
        rows={5}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.status}
              type="button"
              onClick={() => update(action.status)}
              disabled={Boolean(isSubmitting)}
              className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium disabled:opacity-60"
            >
              <Icon size={16} aria-hidden />
              {isSubmitting === action.status ? "Saving" : action.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}

