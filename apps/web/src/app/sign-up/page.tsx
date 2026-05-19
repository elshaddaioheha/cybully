import { AuthPanel } from "@/components/AuthPanel";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const session = await getSession();
  if (session) {
    redirect("/app");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-8 sm:py-10">
      <AuthPanel mode="sign-up" appName={process.env.NEXT_PUBLIC_APP_NAME ?? "Cybully Safety"} />
    </main>
  );
}
