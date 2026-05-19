import { AppShell } from "@/components/AppShell";
import { SignOutButton } from "@/components/SignOutButton";
import { requireUser } from "@/lib/guards";

export default async function SettingsPage() {
  const session = await requireUser();

  return (
    <AppShell session={session}>
      <section className="rounded-md border border-line bg-white p-5">
        <h1 className="text-xl font-semibold text-ink">Settings</h1>
        <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">Name</dt>
            <dd className="mt-1 text-ink">{session.user?.name ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Email</dt>
            <dd className="mt-1 text-ink">{session.user?.email}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Role</dt>
            <dd className="mt-1 capitalize text-ink">{session.user?.role}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </section>
    </AppShell>
  );
}
