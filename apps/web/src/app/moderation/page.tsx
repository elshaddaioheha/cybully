import { AppShell } from "@/components/AppShell";
import { IncidentDashboard } from "@/components/IncidentDashboard";
import { backendFetch } from "@/lib/backend";
import { requireModerator } from "@/lib/guards";
import type { AlertListResponse, IncidentListResponse } from "@/types";

export default async function ModerationPage() {
  const session = await requireModerator();
  const [incidents, alerts] = await Promise.all([
    backendFetch<IncidentListResponse>("/api/v1/incidents"),
    backendFetch<AlertListResponse>("/api/v1/alerts", { query: new URLSearchParams({ limit: "10" }) })
  ]);

  return (
    <AppShell session={session}>
      <IncidentDashboard initialIncidents={incidents} initialAlerts={alerts} />
    </AppShell>
  );
}

