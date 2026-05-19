import { serverEnv } from "@/lib/server-env";

export function moderatorEmails(): string[] {
  return (serverEnv("MODERATOR_EMAILS") ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isModeratorEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }
  return moderatorEmails().includes(email.toLowerCase());
}

export function apiBaseUrl(): string {
  return serverEnv("API_BASE_URL") ?? "http://localhost:8000";
}

export function backendInternalToken(): string {
  return serverEnv("BACKEND_INTERNAL_TOKEN") ?? "dev-internal-token";
}
