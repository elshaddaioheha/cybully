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
        <Link href="/moderation" className="text-sm font-medium text-brand hover:underline">
          Back to queue
        </Link>
        <section className="rounded-md border border-line bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-ink">Incident detail</h1>
              <p className="mt-1 text-sm text-slate-500">{incident.id}</p>
            </div>
            <SeverityBadge severity={incident.severity_level} />
          </div>
          <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-medium text-slate-500">Severity score</dt>
              <dd className="mt-1 text-lg font-semibold text-ink">{incident.severity_score.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Status</dt>
              <dd className="mt-1 capitalize text-ink">{incident.status}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Model</dt>
              <dd className="mt-1 text-ink">{incident.model_version}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-md border border-line bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Content</h2>
          <p className="mt-3 whitespace-pre-wrap rounded-md border border-line bg-slate-50 p-3 text-sm leading-6">{incident.text}</p>
          <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">From</dt>
              <dd className="mt-1 text-ink">{incident.user_id}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Target</dt>
              <dd className="mt-1 text-ink">{incident.target_user_id}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-md border border-line bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Model signals</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["Aggression", incident.aggression_score],
              ["Intent", incident.intent_score],
              ["Repetition", incident.repetition_score],
              ["Toxic", incident.toxic_score],
              ["Insult", incident.insult_score],
              ["Identity attack", incident.identity_attack_score]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-line p-3">
                <div className="text-sm font-medium text-slate-500">{label}</div>
                <div className="mt-1 text-lg font-semibold text-ink">{Number(value).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </section>

        <IncidentReviewPanel incident={incident} />
      </div>
    </AppShell>
  );
}

