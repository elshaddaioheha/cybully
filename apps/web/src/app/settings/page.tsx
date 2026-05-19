import { AppShell } from "@/components/AppShell";
import { SignOutButton } from "@/components/SignOutButton";
import { requireUser } from "@/lib/guards";

export default async function SettingsPage() {
  const session = await requireUser();

  return (
    <AppShell session={session}>
      <section className="ui-card">
        <h1 className="ui-section-title">Settings</h1>
        <dl className="mt-7 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="ui-label">Name</dt>
            <dd className="rounded-xl bg-field px-4 py-3 text-ink">{session.user?.name ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="ui-label">Email</dt>
            <dd className="rounded-xl bg-field px-4 py-3 text-ink">{session.user?.email}</dd>
          </div>
          <div>
            <dt className="ui-label">Role</dt>
            <dd className="rounded-xl bg-field px-4 py-3 capitalize text-ink">{session.user?.role}</dd>
          </div>
        </dl>
        <div className="mt-8">
          <SignOutButton variant="danger" />
        </div>
      </section>
    </AppShell>
  );
}
