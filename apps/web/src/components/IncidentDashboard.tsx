"use client";

import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

  async function refresh() {
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
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 5000);
    return () => window.clearInterval(id);
  }, [query]);

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-line bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">Moderation queue</h1>
            <p className="mt-1 text-sm text-slate-600">{incidents.total} incidents match the current filters.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium text-slate-700">
              Severity
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value as "" | SeverityLevel)}
                className="focus-ring mt-1 block h-10 rounded-md border border-line bg-white px-3"
              >
                {severities.map((value) => (
                  <option key={value || "all"} value={value}>
                    {value || "All"}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as "" | IncidentStatus)}
                className="focus-ring mt-1 block h-10 rounded-md border border-line bg-white px-3"
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
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium"
            >
              <RefreshCcw size={16} aria-hidden className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
              <tr>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Text</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Opened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {incidents.items.map((incident) => (
                <tr key={incident.id}>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={incident.severity_level} />
                  </td>
                  <td className="px-4 py-3 font-medium">{incident.severity_score.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-52 truncate">{incident.user_id}</div>
                    <div className="max-w-52 truncate text-slate-500">to {incident.target_user_id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/moderation/incidents/${incident.id}`} className="line-clamp-2 max-w-xl text-brand hover:underline">
                      {incident.text}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{incident.status}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(incident.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {incidents.items.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    No incidents found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-5">
        <h2 className="text-base font-semibold text-ink">Stubbed high-severity alerts</h2>
        <div className="mt-3 divide-y divide-line">
          {alerts.items.map((alert) => (
            <div key={alert.id} className="py-3 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium">Incident {alert.incident_id}</span>
                <span className="text-slate-500">{new Date(alert.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-slate-600">Score {alert.severity_score.toFixed(2)} sent to {alert.recipient} as {alert.delivery_state}.</p>
            </div>
          ))}
          {alerts.items.length === 0 ? <p className="py-3 text-sm text-slate-500">No alert stubs yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

