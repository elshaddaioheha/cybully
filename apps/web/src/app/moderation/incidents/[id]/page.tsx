import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { IncidentReviewPanel } from "@/components/IncidentReviewPanel";
import { SeverityBadge } from "@/components/SeverityBadge";
import { backendFetch } from "@/lib/backend";
import { requireModerator } from "@/lib/guards";
import type { Incident } from "@/types";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function IncidentDetailPage({ params }: PageProps) {
  const session = await requireModerator();
  const incident = await backendFetch<Incident>(`/api/v1/incidents/${params.id}`);

  return (
    <AppShell session={session}>
      <div className="space-y-6">
        <Link href="/moderation" className="text-sm font-bold text-brand hover:underline">
          Back to queue
        </Link>
        <section className="ui-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="ui-section-title">Incident detail</h1>
              <p className="mt-2 text-sm text-muted">{incident.id}</p>
            </div>
            <SeverityBadge severity={incident.severity_level} />
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div className="ui-card-subtle text-center">
              <dt className="text-sm font-bold text-ink">Severity score</dt>
              <dd className="mt-6 text-5xl font-bold leading-none text-ink">{incident.severity_score.toFixed(2)}</dd>
            </div>
            <div className="ui-card-subtle text-center">
              <dt className="text-sm font-bold text-ink">Status</dt>
              <dd className="mt-6 text-4xl font-bold capitalize leading-none text-ink">{incident.status}</dd>
            </div>
            <div className="ui-card-subtle text-center">
              <dt className="text-sm font-bold text-ink">Model</dt>
              <dd className="mt-6 text-lg font-bold text-ink">{incident.model_version}</dd>
            </div>
          </dl>
        </section>

        <section className="ui-card">
          <h2 className="ui-section-title">Content</h2>
          <p className="mt-5 whitespace-pre-wrap rounded-xl border border-line bg-field p-4 text-base leading-7">{incident.text}</p>
          <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="ui-label">From</dt>
              <dd className="rounded-xl bg-field px-4 py-3 text-ink">{incident.user_id}</dd>
            </div>
            <div>
              <dt className="ui-label">Target</dt>
              <dd className="rounded-xl bg-field px-4 py-3 text-ink">{incident.target_user_id}</dd>
            </div>
          </dl>
        </section>

        <section className="ui-card">
          <h2 className="ui-section-title">Model signals</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ["Aggression", incident.aggression_score],
              ["Intent", incident.intent_score],
              ["Repetition", incident.repetition_score],
              ["Toxic", incident.toxic_score],
              ["Insult", incident.insult_score],
              ["Identity attack", incident.identity_attack_score]
            ].map(([label, value]) => (
              <div key={label} className="ui-card-subtle text-center">
                <div className="text-sm font-bold text-ink">{label}</div>
                <div className="mt-5 text-4xl font-bold leading-none text-ink">{Number(value).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </section>

        <IncidentReviewPanel incident={incident} />
      </div>
    </AppShell>
  );
}
