"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SeverityBadge } from "@/components/SeverityBadge";
import type { AlertListResponse, IncidentListResponse, IncidentStatus, SeverityLevel } from "@/types";

const severities: Array<"" | SeverityLevel> = ["", "low", "medium", "high"];
const statuses: Array<"" | IncidentStatus> = ["", "analyzed", "reviewed", "dismissed", "escalated"];

type IncidentDashboardProps = {
  initialIncidents: IncidentListResponse;
  initialAlerts: AlertListResponse;
};

export function IncidentDashboard({ initialIncidents, initialAlerts }: IncidentDashboardProps) {
  const [severity, setSeverity] = useState<"" | SeverityLevel>("");
  const [status, setStatus] = useState<"" | IncidentStatus>("");
  const [incidents, setIncidents] = useState(initialIncidents);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [isRefreshing, setRefreshing] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "25" });
    if (severity) params.set("severity", severity);
    if (status) params.set("status", status);
    return params.toString();
  }, [severity, status]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [incidentResponse, alertResponse] = await Promise.all([
        fetch(`/api/incidents?${query}`, { cache: "no-store" }),
        fetch("/api/alerts?limit=10", { cache: "no-store" })
      ]);
      if (incidentResponse.ok) {
        setIncidents(await incidentResponse.json());
      }
      if (alertResponse.ok) {
        setAlerts(await alertResponse.json());
      }
    } finally {
      setRefreshing(false);
    }
  }, [query]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 5000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return (
    <div className="space-y-6">
      {/* Fallback Banner */}
      {(incidents.fallback || alerts.fallback) ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md">
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">!</span>
            <div>
              <h4 className="font-bold text-amber-950">Local Fallback Mode Active</h4>
              <p className="mt-1 text-xs sm:text-sm text-amber-850 leading-relaxed">
                The hosted Railway database or backend is currently unreachable. The application has automatically switched to local mock mode. Flagged items and moderator actions will be processed in-memory on the server.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mx-auto max-w-4xl py-6 text-center">
        <h1 className="ui-heading">Safety Moderator Dashboard</h1>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-muted sm:mt-5 sm:text-lg sm:leading-8">
          Evaluate flagged message risks, inspect model signals, and execute moderator decisions.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="ui-card text-center">
          <p className="text-sm font-bold text-ink">Total Flagged Incidents</p>
          <p className="ui-metric mt-7">{incidents.total}</p>
        </div>
        <div className="ui-card text-center">
          <p className="text-sm font-bold text-ink">Active Danger Alerts</p>
          <p className="ui-metric mt-7">{alerts.total}</p>
        </div>
        <div className="ui-card text-center">
          <p className="text-sm font-bold text-ink">Auto-refreshing</p>
          <p className="mt-7 text-3xl font-bold leading-none text-ink sm:text-5xl">5s</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <section className="ui-card">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="ui-section-title">Flagged Messages Queue</h2>
                <p className="mt-3 text-sm leading-6 text-muted sm:text-base sm:leading-7">{incidents.total} flagged incidents match your search filters.</p>
              </div>
              <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-end">
                <label className="text-sm font-bold text-ink">
                  Severity
                  <select
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value as "" | SeverityLevel)}
                    className="ui-input mt-2 block h-12 w-full py-2 sm:min-w-32"
                  >
                    {severities.map((value) => (
                      <option key={value || "all"} value={value}>
                        {value || "All"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold text-ink">
                  Status
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as "" | IncidentStatus)}
                    className="ui-input mt-2 block h-12 w-full py-2 sm:min-w-36"
                  >
                    {statuses.map((value) => (
                      <option key={value || "all"} value={value}>
                        {value || "All"}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={refresh}
                  className="ui-secondary-button h-12 w-full sm:w-auto"
                >
                  <HugeiconsIcon
                    icon={ArrowReloadHorizontalIcon}
                    size={16}
                    strokeWidth={1.9}
                    className={isRefreshing ? "animate-spin" : ""}
                    aria-hidden
                  />
                  Refresh
                </button>
              </div>
            </div>
          </section>

          <section className="ui-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="bg-field text-left text-xs font-bold uppercase tracking-normal text-muted">
                  <tr>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4">Risk Score</th>
                    <th className="px-6 py-4">Participants</th>
                    <th className="px-6 py-4">Flagged Text</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Flagged Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {incidents.items.map((incident) => (
                    <tr key={incident.id}>
                      <td className="px-6 py-4">
                        <SeverityBadge severity={incident.severity_level} />
                      </td>
                      <td className="px-6 py-4 text-lg font-bold">{incident.severity_score.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-ink">From:</span>
                            <span className="max-w-36 truncate" title={incident.user_id}>{incident.user_id}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted">
                            <span>To:</span>
                            <span className="max-w-36 truncate" title={incident.target_user_id}>{incident.target_user_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/moderation/incidents/${incident.id}`} className="line-clamp-2 max-w-xl text-brand hover:underline font-medium">
                          {incident.text}
                        </Link>
                      </td>
                      <td className="px-6 py-4 capitalize font-semibold">{incident.status}</td>
                      <td className="px-6 py-4 text-muted">{new Date(incident.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {incidents.items.length === 0 ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-muted" colSpan={6}>
                        No flagged incidents found in queue.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="ui-card">
            <h2 className="ui-section-title">Automated Safety Alerts</h2>
            <div className="mt-3 divide-y divide-line">
              {alerts.items.map((alert) => (
                <div key={alert.id} className="py-3 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-bold">Incident ID: {alert.incident_id}</span>
                    <span className="text-muted text-xs">{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-muted">Risk Score <span className="font-bold text-ink">{alert.severity_score.toFixed(2)}</span> dispatched to <span className="font-medium text-ink">{alert.recipient}</span> as <span className="font-medium text-brand capitalize">{alert.delivery_state}</span>.</p>
                </div>
              ))}
              {alerts.items.length === 0 ? <p className="py-3 text-sm text-muted">No alert stubs triggered yet.</p> : null}
            </div>
          </section>
        </div>

        {/* Sidebar Moderator Playbook */}
        <div className="space-y-6">
          <section className="ui-card">
            <h2 className="ui-section-title">Moderator Playbook</h2>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Use these protocols to perform content safety audits and execute resolution actions:
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-line bg-field p-3 text-xs">
                <h4 className="font-bold text-ink flex items-center gap-1.5">
                  <span>🛡️</span> Actions & Functions
                </h4>
                <ul className="mt-2 space-y-2 text-muted list-disc list-inside">
                  <li>
                    <strong className="text-ink">Flag Reviewed:</strong> Acknowledge toxicity/bad behavior to keep tracked in records.
                  </li>
                  <li>
                    <strong className="text-ink">Dismiss Safe:</strong> Clear false alarms or friendly banter as harmless.
                  </li>
                  <li>
                    <strong className="text-ink">Escalate Admin:</strong> Escalate direct threats, extreme abuse, or repeat offenders.
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-line bg-field p-3 text-xs">
                <h4 className="font-bold text-ink flex items-center gap-1.5">
                  <span>📊</span> Risk Thresholds
                </h4>
                <p className="mt-2 text-muted leading-relaxed">
                  Scores above <span className="font-bold text-ink">0.40</span> trigger Medium severity. 
                  Scores above <span className="font-bold text-ink">0.70</span> trigger High severity and dispatch safety alerts.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-field p-3 text-xs text-muted leading-relaxed">
                <span className="font-bold text-ink">Server Sync Note:</span> Under local fallback mode, all changes are saved in-memory and will reset if the server restarts.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

