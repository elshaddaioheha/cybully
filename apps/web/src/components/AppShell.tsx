import Link from "next/link";
import { FileText, Settings, ShieldAlert, Send } from "lucide-react";
import type { Session } from "next-auth";

type AppShellProps = {
  session: Session;
  children: React.ReactNode;
};

const links = [
  { href: "/app", label: "Submit", icon: Send, role: "user" },
  { href: "/moderation", label: "Moderation", icon: ShieldAlert, role: "moderator" },
  { href: "/settings", label: "Settings", icon: Settings, role: "user" }
];

export function AppShell({ session, children }: AppShellProps) {
  const role = session.user?.role ?? "user";
  const visibleLinks = links.filter((link) => link.role === "user" || role === "moderator");

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/app" className="flex items-center gap-3 text-sm font-bold text-ink">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
              <FileText size={18} aria-hidden />
            </span>
            Cybully Safety
          </Link>
            <div className="flex items-center gap-3 text-sm text-muted">
              <span className="hidden sm:inline">{session.user?.email}</span>
              <span className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold uppercase tracking-normal">
              {role}
            </span>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-ink shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-brand hover:text-brand"
                >
                  <Icon size={17} aria-hidden />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
