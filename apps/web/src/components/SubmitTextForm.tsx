"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  SentIcon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  InformationCircleIcon,
  TaskDaily02Icon
} from "@hugeicons/core-free-icons";

interface ScannedMessage {
  id: string;
  text: string;
  targetUserId: string;
  timestamp: string;
  isFallback: boolean;
}

export function SubmitTextForm() {
  const [targetUserId, setTargetUserId] = useState("");
  const [text, setText] = useState("");
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [history, setHistory] = useState<ScannedMessage[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"history" | "notifications">("history");

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  }

  // Load history from localStorage on mount & notifications
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cybully_user_scans");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load user scan history:", e);
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH"
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setTrackingId(null);
    setIsFallback(false);

    try {
      const response = await fetch("/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: targetUserId, text })
      });
      const raw = await response.text();
      let body: Record<string, unknown> = {};
      if (raw) {
        try {
          body = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          body = { error: raw };
        }
      }
      if (!response.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "Submission failed");
      }
      
      const newId = typeof body.tracking_id === "string" ? body.tracking_id : "unknown-id";
      const fallbackActive = body.fallback === true;

      setTrackingId(newId);
      setIsFallback(fallbackActive);

      // Append to local activity history
      const newScan: ScannedMessage = {
        id: newId,
        text,
        targetUserId,
        timestamp: new Date().toISOString(),
        isFallback: fallbackActive
      };

      const updatedHistory = [newScan, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem("cybully_user_scans", JSON.stringify(updatedHistory));

      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem("cybully_user_scans");
  }

  return (
    <div className="space-y-8">
      {/* Quick Start & Guidelines Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="ui-card-subtle flex gap-3 p-4">
          <span className="text-xl sm:text-2xl">🎯</span>
          <div>
            <h4 className="text-sm font-bold text-ink">1. Target Harassment</h4>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Input the sender and target user identifiers. This tracks targeted, repeated incidents over window periods.
            </p>
          </div>
        </div>
        <div className="ui-card-subtle flex gap-3 p-4">
          <span className="text-xl sm:text-2xl">📝</span>
          <div>
            <h4 className="text-sm font-bold text-ink">2. Submit Text Content</h4>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Enter the message, post, or text snippet. Supports up to 5,000 characters.
            </p>
          </div>
        </div>
        <div className="ui-card-subtle flex gap-3 p-4">
          <span className="text-xl sm:text-2xl">🛡️</span>
          <div>
            <h4 className="text-sm font-bold text-ink">3. Risk Profiling</h4>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              The safety engine scores aggression, toxic insults, and identity hate. Incidents are flagged instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="ui-card flex min-h-0 flex-col sm:min-h-[600px]">
          <div>
            <h2 className="ui-section-title">Message Safety Scanner</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              Analyze text for cyberbullying indicators. High-risk logs trigger system alerts.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="target_user_id" className="ui-label">
                Recipient User Identifier (Email, Username, or ID)
              </label>
              <input
                id="target_user_id"
                value={targetUserId}
                onChange={(event) => setTargetUserId(event.target.value)}
                placeholder="recipient_username_or_id"
                className="ui-input"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="text" className="ui-label mb-0">
                  Message contents
                </label>
                <span className="text-xs font-semibold text-muted">{text.length}/5000</span>
              </div>
              <textarea
                id="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={10}
                maxLength={5000}
                placeholder="Type or paste the communication text you wish to analyze..."
                className="ui-input mt-2 resize-none"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="mt-auto pt-6">
            <button type="submit" disabled={isSubmitting} className="ui-primary-button w-full">
              <HugeiconsIcon icon={SentIcon} size={18} strokeWidth={1.9} aria-hidden />
              {isSubmitting ? "Scanning message safety..." : "Scan message safety"}
            </button>
          </div>
        </form>

        <section className="ui-card flex flex-col justify-between">
          <div>
            <h2 className="ui-section-title">Analysis Metrics & Results</h2>

            <div className="mt-5 space-y-4">
              <div className="ui-card-subtle text-center">
                <p className="text-xs font-bold text-ink">Submission Status</p>
                <p className="ui-metric mt-4 text-2xl sm:text-3xl">
                  {trackingId ? "Success (202 Accepted)" : "Awaiting Input"}
                </p>
              </div>

              <div className="ui-card-subtle text-center">
                <p className="text-xs font-bold text-ink">Scan Process</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-2xl font-bold text-ink">
                  <HugeiconsIcon
                    icon={isSubmitting ? Clock01Icon : CheckmarkCircle01Icon}
                    size={24}
                    strokeWidth={1.9}
                    className={isSubmitting ? "animate-spin text-brand" : "text-emerald-600"}
                    aria-hidden
                  />
                  {isSubmitting ? "Running NLP Evaluation" : trackingId ? "Scan Complete" : "System Ready"}
                </div>
              </div>

              <div
                className={`ui-alert-block ${
                  error ? "bg-danger" : trackingId ? "bg-success" : "bg-brand"
                }`}
              >
                {error
                  ? "Scan Unsuccessful"
                  : trackingId
                  ? "Incident Risk Analyzed & Logged"
                  : "Awaiting Next Text Submission"}
              </div>

              {trackingId ? (
                <div className="rounded-xl border border-line bg-white px-4 py-3 text-center text-xs font-medium text-muted">
                  Tracking Incident ID: <span className="font-bold text-ink">{trackingId}</span>
                </div>
              ) : null}

              {isFallback ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-center text-xs text-amber-900 font-medium leading-relaxed">
                  ⚠️ Database operates in local fallback mode. Logs are stored in transient memory.
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl bg-danger px-4 py-3 text-center text-sm font-bold text-white">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-lg font-bold text-ink flex items-center gap-2">
              <HugeiconsIcon icon={InformationCircleIcon} size={18} strokeWidth={1.9} aria-hidden />
              Risk Classification
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Cyberbullying scoring maps intent, hate speech, and toxicity. Flagged messages are dispatched to the moderation queue for administrator triage.
            </p>
          </div>
        </section>
      </div>

      {/* Session Activity Log & Notifications */}
      <section className="ui-card">
        <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === "history"
                  ? "border-brand text-brand"
                  : "border-transparent text-muted hover:text-ink"
              }`}
              type="button"
            >
              Session Scan Activity Log
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`pb-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "notifications"
                  ? "border-brand text-brand"
                  : "border-transparent text-muted hover:text-ink"
              }`}
              type="button"
            >
              Notification Inbox
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-xxs font-bold text-white leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          {activeTab === "history" && history.length > 0 ? (
            <button
              onClick={clearHistory}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
              type="button"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.9} aria-hidden />
              Clear Log
            </button>
          ) : null}
        </div>

        {activeTab === "history" ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-field text-left text-xs font-bold uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Message Preview</th>
                  <th className="px-4 py-3">Tracking ID</th>
                  <th className="px-4 py-3">Database Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-field/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 text-ink font-semibold">{item.targetUserId}</td>
                    <td className="px-4 py-3 text-muted max-w-xs truncate" title={item.text}>
                      {item.text}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink">{item.id}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                          item.isFallback
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.isFallback ? "Fallback Log" : "Live Store"}
                      </span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted" colSpan={5}>
                      No safety scans logged in this session yet. Submit text above to begin.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  notif.read
                    ? "bg-white border-line"
                    : "bg-brand/5 border-brand/20 shadow-sm"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        notif.read ? "bg-muted/30" : "bg-brand animate-pulse"
                      }`}
                    />
                    <p className="text-xs text-muted">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className={`text-sm text-ink leading-relaxed ${!notif.read ? "font-bold" : ""}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="text-xs font-bold text-brand hover:underline shrink-0"
                    type="button"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-muted text-sm">
                Your notification inbox is currently empty.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
