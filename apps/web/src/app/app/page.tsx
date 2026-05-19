import { AppShell } from "@/components/AppShell";
import { SubmitTextForm } from "@/components/SubmitTextForm";
import { requireUser } from "@/lib/guards";

export default async function SubmitPage() {
  const session = await requireUser();

  return (
    <AppShell session={session}>
      <div className="space-y-6">
        <section>
          <h1 className="text-xl font-semibold text-ink">Submit text for analysis</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            The backend accepts the payload immediately, runs Detoxify in the worker pipeline, and persists the incident asynchronously.
          </p>
        </section>
        <SubmitTextForm />
      </div>
    </AppShell>
  );
}

