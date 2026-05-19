export function moderatorEmails(): string[] {
  return (process.env.MODERATOR_EMAILS ?? "")
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
  return process.env.API_BASE_URL ?? "http://localhost:8000";
}

export function backendInternalToken(): string {
  return process.env.BACKEND_INTERNAL_TOKEN ?? "dev-internal-token";
}

