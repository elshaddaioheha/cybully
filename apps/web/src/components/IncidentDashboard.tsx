"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ArrowReloadHorizontalIcon, 
  Flag01Icon, 
  Cancel01Icon, 
  Shield01Icon,
  CheckmarkCircle01Icon
} from "@hugeicons/core-free-icons";
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
  const [searchQuery, setSearchQuery] = useState("");
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

  // Derived stats counters
  const stats = useMemo(() => {
    const items = incidents.items || [];
    const pending = items.filter((i) => i.status === "analyzed" || i.status === "queued").length;
    const escalated = items.filter((i) => i.status === "escalated").length;
    const dismissed = items.filter((i) => i.status === "dismissed").length;
    
    let totalScore = 0;
    items.forEach(item => {
      totalScore += item.severity_score || 0;
    });
    const averageScore = items.length ? totalScore / items.length : 0;

    return { pending, escalated, dismissed, averageScore };
  }, [incidents.items]);

  // Client-side quick filter
  const filteredIncidents = useMemo(() => {
    const items = incidents.items || [];
    if (!searchQuery.trim()) return items;
    
    const term = searchQuery.toLowerCase();
    return items.filter((item) => {
      return (
        item.id.toLowerCase().includes(term) ||
        (item.text ?? "").toLowerCase().includes(term) ||
        (item.user_id ?? "").toLowerCase().includes(term) ||
        (item.target_user_id ?? "").toLowerCase().includes(term)
      );
    });
  }, [incidents.items, searchQuery]);

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

      {/* Expanded Metrics Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="ui-card text-center">
          <p className="text-sm font-bold text-ink">Backlog Queue</p>
          <p className="ui-metric mt-4 text-brand">{stats.pending}</p>
        </div>
        <div className="ui-card text-center">
          <p className="text-sm font-bold text-ink">Escalated Cases</p>
          <p className="ui-metric mt-4 text-red-600">{stats.escalated}</p>
        </div>
        <div className="ui-card text-center">
          <p className="text-sm font-bold text-ink">Dismissed Clean</p>
          <p className="ui-metric mt-4 text-emerald-600">{stats.dismissed}</p>
        </div>
        <div className="ui-card text-center">
          <p className="text-sm font-bold text-ink">Average Toxicity</p>
          <p className="ui-metric mt-4 text-ink">{stats.averageScore.toFixed(2)}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <section className="ui-card space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="ui-section-title">Flagged Messages Queue</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Showing {filteredIncidents.length} flagged incidents. Use filters and search below to refine the list.
                </p>
              </div>
              <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-end">
                <label className="text-xs font-bold text-ink">
                  Severity
                  <select
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value as "" | SeverityLevel)}
                    className="ui-input mt-1.5 block h-10 w-full py-1 sm:min-w-28 text-xs"
                  >
                    {severities.map((value) => (
                      <option key={value || "all"} value={value}>
                        {value ? value.toUpperCase() : "All Severities"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-ink">
                  Status
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as "" | IncidentStatus)}
                    className="ui-input mt-1.5 block h-10 w-full py-1 sm:min-w-32 text-xs"
                  >
                    {statuses.map((value) => (
                      <option key={value || "all"} value={value}>
                        {value ? value.toUpperCase() : "All Statuses"}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={refresh}
                  className="ui-secondary-button h-10 w-full sm:w-auto text-xs font-bold"
                >
                  <HugeiconsIcon
                    icon={ArrowReloadHorizontalIcon}
                    size={14}
                    strokeWidth={1.9}
                    className={isRefreshing ? "animate-spin" : ""}
                    aria-hidden
                  />
                  Refresh
                </button>
              </div>
            </div>

            {/* Real-time Content Search Input */}
            <div className="pt-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by message keyword, tracking ID, sender or recipient username..."
                className="ui-input w-full"
              />
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
                  {filteredIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-field/20 transition-colors">
                      <td className="px-6 py-4">
                        <SeverityBadge severity={incident.severity_level} />
                      </td>
                      <td className="px-6 py-4 text-lg font-bold">{incident.severity_score.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-ink">From:</span>
                            <span className="max-w-28 truncate" title={incident.user_id}>{incident.user_id}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted">
                            <span>To:</span>
                            <span className="max-w-28 truncate" title={incident.target_user_id}>{incident.target_user_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/moderation/incidents/${incident.id}`} className="line-clamp-2 max-w-xl text-brand hover:underline font-medium">
                          {incident.text}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                          incident.status === "reviewed" ? "bg-emerald-100 text-emerald-800" :
                          incident.status === "dismissed" ? "bg-gray-100 text-gray-700" :
                          incident.status === "escalated" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted text-xs">{new Date(incident.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-muted" colSpan={6}>
                        {searchQuery ? "No incidents matches your search criteria." : "No flagged incidents found in queue."}
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
                    <span className="font-bold text-xs font-mono">Incident ID: {alert.incident_id}</span>
                    <span className="text-muted text-xs">{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-muted text-xs">Risk Score <span className="font-bold text-ink">{alert.severity_score.toFixed(2)}</span> dispatched to <span className="font-medium text-ink">{alert.recipient}</span> as <span className="font-medium text-brand capitalize">{alert.delivery_state}</span>.</p>
                </div>
              ))}
              {alerts.items.length === 0 ? <p className="py-3 text-sm text-muted">No alert stubs triggered yet.</p> : null}
            </div>
          </section>
        </div>

        {/* Sidebar Moderator Playbook */}
        <div className="space-y-6">
          <section className="ui-card">
            <h2 className="ui-section-title flex items-center gap-1.5">
              <HugeiconsIcon icon={Shield01Icon} size={18} strokeWidth={1.9} aria-hidden className="text-brand" />
              Moderator Playbook
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Use these protocols to perform content safety audits and execute resolution actions:
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-line bg-field p-3 text-xs">
                <h4 className="font-bold text-ink flex items-center gap-1.5">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} strokeWidth={1.9} className="text-emerald-600" />
                  Flag Reviewed
                </h4>
                <p className="mt-1 text-muted leading-relaxed">
                  Confirms the toxicity. Logs the safety infraction to the offender&apos;s profile and flags their account state.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-field p-3 text-xs">
                <h4 className="font-bold text-ink flex items-center gap-1.5">
                  <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.9} className="text-gray-500" />
                  Dismiss Safe
                </h4>
                <p className="mt-1 text-muted leading-relaxed">
                  Declares text as friendly banter or a false warning. Clears status back to normal and closes investigation.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-field p-3 text-xs">
                <h4 className="font-bold text-ink flex items-center gap-1.5">
                  <HugeiconsIcon icon={Flag01Icon} size={14} strokeWidth={1.9} className="text-red-600" />
                  Escalate Admin
                </h4>
                <p className="mt-1 text-muted leading-relaxed">
                  Escalates direct violent threats, severe child exploitation indicators, or repeated harassment cases for immediate ban.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-field p-3 text-xs">
                <h4 className="font-bold text-ink">📊 Alerting Levels</h4>
                <p className="mt-1 text-muted leading-relaxed">
                  Toxicity scores above <span className="font-bold text-ink">0.40</span> trigger Medium severity warnings. 
                  Scores above <span className="font-bold text-ink">0.70</span> trigger High severity emergency email alert dispatch.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-field p-3 text-xs text-muted leading-relaxed">
                <span className="font-bold text-ink">Server Connection Status:</span> Under local fallback mode, all changes are saved in-memory and will reset if the server restarts.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
