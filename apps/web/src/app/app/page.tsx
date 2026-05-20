import { AppShell } from "@/components/AppShell";
import { SubmitTextForm } from "@/components/SubmitTextForm";
import { requireUser } from "@/lib/guards";

export default async function SubmitPage() {
  const session = await requireUser();

  return (
    <AppShell session={session}>
      <div className="space-y-10">
        <section className="mx-auto max-w-4xl py-6 text-center">
          <h1 className="ui-heading">Cyberbullying Detection Console</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-muted sm:mt-5 sm:text-lg sm:leading-8">
            Submit text, queue analysis, and review the moderation outcome from a focused safety operations workspace.
          </p>
        </section>
        <SubmitTextForm />
      </div>
    </AppShell>
  );
}
