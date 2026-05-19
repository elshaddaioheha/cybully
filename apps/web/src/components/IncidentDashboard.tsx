"use client";

import Link from "next/link";
import { RefreshCcw } from "lucide-react";
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
      <section className="mx-auto max-w-4xl py-6 text-center">
        <h1 className="ui-heading">Moderation Dashboard</h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted">
          Review model outcomes, severity distribution, and alert stubs from a minimal operations grid.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="ui-card text-center">
          <p className="text-sm font-bold text-ink">Total Incidents</p>
          <p className="ui-metric mt-7">{incidents.total}</p>
        </div>
        <div className="ui-card text-center">
          <p className="text-sm font-bold text-ink">High Alerts</p>
          <p className="ui-metric mt-7">{alerts.total}</p>
        </div>
        <div className="ui-card text-center">
          <p className="text-sm font-bold text-ink">Refresh</p>
          <p className="mt-7 text-5xl font-bold leading-none text-ink">5s</p>
        </div>
      </section>

      <section className="ui-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="ui-section-title">Moderation queue</h2>
            <p className="mt-3 text-base leading-7 text-muted">{incidents.total} incidents match the current filters.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-bold text-ink">
              Severity
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value as "" | SeverityLevel)}
                className="ui-input mt-2 block h-12 min-w-32 py-2"
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
                className="ui-input mt-2 block h-12 min-w-36 py-2"
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
              className="ui-secondary-button h-12"
            >
              <RefreshCcw size={16} aria-hidden className={isRefreshing ? "animate-spin" : ""} />
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
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Users</th>
                <th className="px-6 py-4">Text</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Opened</th>
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
                    <div className="max-w-52 truncate">{incident.user_id}</div>
                    <div className="max-w-52 truncate text-muted">to {incident.target_user_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/moderation/incidents/${incident.id}`} className="line-clamp-2 max-w-xl text-brand hover:underline">
                      {incident.text}
                    </Link>
                  </td>
                  <td className="px-6 py-4 capitalize">{incident.status}</td>
                  <td className="px-6 py-4 text-muted">{new Date(incident.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {incidents.items.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-muted" colSpan={6}>
                    No incidents found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ui-card">
        <h2 className="ui-section-title">Stubbed high-severity alerts</h2>
        <div className="mt-3 divide-y divide-line">
          {alerts.items.map((alert) => (
            <div key={alert.id} className="py-3 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-bold">Incident {alert.incident_id}</span>
                <span className="text-muted">{new Date(alert.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-muted">Score {alert.severity_score.toFixed(2)} sent to {alert.recipient} as {alert.delivery_state}.</p>
            </div>
          ))}
          {alerts.items.length === 0 ? <p className="py-3 text-sm text-muted">No alert stubs yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
