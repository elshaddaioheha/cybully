"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, Settings01Icon, Shield01Icon, UserCircleIcon } from "@hugeicons/core-free-icons";

import { SignOutButton } from "@/components/SignOutButton";

type ProfileMenuProps = {
  email?: string | null;
  name?: string | null;
  role?: "user" | "moderator";
};

const links = [
  { href: "/app", label: "Submit", icon: SentIcon, role: "user" },
  { href: "/moderation", label: "Moderation", icon: Shield01Icon, role: "moderator" },
  { href: "/settings", label: "Settings", icon: Settings01Icon, role: "user" }
] as const;

function profileInitial(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "U";
  return source.charAt(0).toUpperCase();
}

export function ProfileMenu({ email, name, role = "user" }: ProfileMenuProps) {
  const pathname = usePathname();
  const [isOpen, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const visibleLinks = useMemo(
    () => links.filter((link) => link.role === "user" || role === "moderator"),
    [role]
  );
  const initial = profileInitial(name, email);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open profile menu"
        onClick={() => setOpen((current) => !current)}
        className="focus-ring flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-sm font-bold text-ink shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-brand hover:text-brand"
      >
        {name || email ? (
          <span aria-hidden>{initial}</span>
        ) : (
          <HugeiconsIcon icon={UserCircleIcon} size={20} strokeWidth={1.9} aria-hidden />
        )}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-14 z-20 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-4 shadow-[0_14px_32px_rgba(16,20,24,0.12)]">
          <div className="rounded-2xl bg-field px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-base font-bold text-white">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{name ?? "Preview account"}</p>
                <p className="truncate text-sm text-muted">{email ?? "No email"}</p>
              </div>
            </div>
          </div>

          <nav className="mt-4 space-y-2" aria-label="Profile navigation">
            {visibleLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/app" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                    isActive
                      ? "bg-field text-brand"
                      : "text-ink hover:bg-field hover:text-brand"
                  }`}
                >
                  <HugeiconsIcon icon={link.icon} size={18} strokeWidth={1.9} aria-hidden />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-line pt-4">
            <SignOutButton variant="danger" fullWidth />
          </div>
        </div>
      ) : null}
    </div>
  );
}
