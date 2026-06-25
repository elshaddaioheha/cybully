import { getSession } from "@/lib/auth";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export const dynamic = "force-dynamic";

export default async function RestrictedPage() {
  const session = await getSession();

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-8 sm:py-10">
      <section className="ui-card w-full max-w-md px-6 py-8 sm:px-7 sm:py-9 text-center space-y-6">
        <BrandLogo href="#" className="mx-auto" />
        
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <HugeiconsIcon icon={Cancel01Icon} size={32} strokeWidth={2} />
        </div>

        <div>
          <h1 className="ui-heading text-red-600">Access Restricted</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Hello, <span className="font-bold text-ink">{session?.user?.email || "User"}</span>. Your access to the Cybully Safety scanner has been restricted.
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-xs text-red-900 leading-relaxed text-left">
          <strong>Reason:</strong> Safety monitors have flagged your recent scan activity for policy violations (cyberbullying, targeted insults, or toxic harassment indicators).
        </div>

        <p className="text-xs text-muted leading-relaxed">
          If you believe this restriction was placed in error, please contact your platform safety team for assistance or review of the flagged incident details.
        </p>

        <div className="pt-2">
          <Link href="/api/auth/logout" className="ui-secondary-button w-full flex items-center justify-center gap-2">
            <HugeiconsIcon icon={Shield01Icon} size={16} strokeWidth={1.9} />
            Sign Out & Reconnect
          </Link>
        </div>
      </section>
    </main>
  );
}
