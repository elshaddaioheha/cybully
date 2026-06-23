import { AppShell } from "@/components/AppShell";
import { SignOutButton } from "@/components/SignOutButton";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { requireUser } from "@/lib/guards";

export default async function SettingsPage() {
  const session = await requireUser();
  const isMock = session.accessToken === "mock-access-token";

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
            <dd className="break-all rounded-xl bg-field px-4 py-3 text-ink">{session.user?.email}</dd>
          </div>
          <div>
            <dt className="ui-label">Role</dt>
            <dd className="rounded-xl bg-field px-4 py-3 capitalize text-ink">{session.user?.role}</dd>
          </div>
        </dl>

        <ChangePasswordForm email={session.user?.email ?? ""} isMock={isMock} />

        <div className="mt-8 pt-6 border-t border-line">
          <SignOutButton variant="danger" />
        </div>
      </section>
    </AppShell>
  );
}
