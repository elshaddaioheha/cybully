import type { AppSession } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { ProfileMenu } from "@/components/ProfileMenu";

type AppShellProps = {
  session: AppSession;
  children: React.ReactNode;
};

export function AppShell({ session, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <BrandLogo href="/app" className="min-w-0" />
          <div className="flex items-center justify-between gap-4">
            <ProfileMenu
              email={session.user?.email}
              name={session.user?.name}
              role={session.user?.role}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
