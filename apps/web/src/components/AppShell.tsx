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
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/app" className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand text-white">
              <FileText size={18} aria-hidden />
            </span>
            Cybully Safety
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="hidden sm:inline">{session.user?.email}</span>
            <span className="rounded-md border border-line px-2 py-1 text-xs font-medium uppercase tracking-normal">
              {role}
            </span>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand"
              >
                <Icon size={17} aria-hidden />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}

