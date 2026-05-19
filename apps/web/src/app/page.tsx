import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  AiSecurity01Icon,
  Analytics01Icon,
  CheckmarkBadge01Icon
} from "@hugeicons/core-free-icons";

import { BrandLogo } from "@/components/BrandLogo";
import { getSession } from "@/lib/auth";

const featureHighlights = [
  {
    title: "Early detection",
    description: "Flag abusive text quickly with severity scoring tuned for safety triage.",
    icon: Alert02Icon
  },
  {
    title: "Moderator workflow",
    description: "Review incidents, inspect signals, and track outcomes from one moderation queue.",
    icon: Analytics01Icon
  },
  {
    title: "Bearer-secured API",
    description: "Supabase sessions flow from the app to FastAPI without exposing admin credentials.",
    icon: AiSecurity01Icon
  }
];

const trustPoints = [
  "Email and password sign-in with Supabase Auth",
  "FastAPI moderation API backed by Supabase Postgres",
  "Focused moderator review flow for MVP validation"
];

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    alt: "People collaborating around a laptop in a digital workspace"
  },
  {
    src: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=900&q=80",
    alt: "Person working on a laptop with messaging and productivity tools"
  },
  {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    alt: "Team discussion around shared work and online communication"
  }
];

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/app");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(31,138,168,0.14),_transparent_28%),linear-gradient(180deg,_#ffffff_0%,_#f8f9fa_48%,_#eef5f7_100%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <BrandLogo href="/" />
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="ui-secondary-button">
            Sign in
          </Link>
          <Link href="/sign-up" className="ui-primary-button w-auto px-6">
            Create account
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pb-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/90 px-4 py-2 text-sm font-bold text-ink shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} strokeWidth={1.9} aria-hidden />
              Safer conversations, clearer moderation
            </div>

            <div className="space-y-5">
              <h1 className="ui-heading max-w-3xl text-5xl md:text-6xl">
                Understand harmful messages before they escalate.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted md:text-xl">
                CyBully is a focused cyberbullying detection workspace for submitting text,
                scoring risk, and giving moderators a fast path from signal to review.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className="ui-primary-button w-full sm:w-auto sm:px-7">
                Start with email
              </Link>
              <Link href="/sign-in" className="ui-secondary-button min-h-12 w-full sm:w-auto sm:px-6">
                Sign in to dashboard
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {featureHighlights.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-line bg-white/88 px-5 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                >
                  <HugeiconsIcon icon={feature.icon} size={20} strokeWidth={1.9} aria-hidden />
                  <h2 className="mt-4 text-base font-bold text-ink">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1.08fr_0.92fr]">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_28px_rgba(16,20,24,0.08)]">
              <Image
                src={galleryImages[0].src}
                alt={galleryImages[0].alt}
                width={1200}
                height={900}
                className="h-[420px] w-full object-cover"
              />
            </div>
            <div className="grid gap-4">
              {galleryImages.slice(1).map((image) => (
                <div
                  key={image.src}
                  className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_24px_rgba(16,20,24,0.08)]"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={900}
                    height={700}
                    className="h-[202px] w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/5 bg-white/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-brand">
              What users get
            </p>
            <h2 className="mt-4 text-3xl font-normal leading-tight text-ink" style={{ letterSpacing: "-0.02em" }}>
              A lean workflow built for product validation, not presentation fluff.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {trustPoints.map((point) => (
              <div
                key={point}
                className="rounded-2xl border border-line bg-field px-5 py-5 text-sm font-medium leading-6 text-ink"
              >
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
