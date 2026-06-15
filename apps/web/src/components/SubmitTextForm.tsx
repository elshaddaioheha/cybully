import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, SentIcon } from "@hugeicons/core-free-icons";

export function SubmitTextForm() {
  const [targetUserId, setTargetUserId] = useState("");
  const [text, setText] = useState("");
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

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
      setTrackingId(typeof body.tracking_id === "string" ? body.tracking_id : null);
      setIsFallback(body.fallback === true);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="ui-card flex min-h-0 flex-col sm:min-h-[640px]">
        <div>
          <h2 className="ui-section-title">Message Risk Scanner</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Provide the sender and recipient identifier, along with the message contents to begin risk profiling.
          </p>
        </div>

        <div className="mt-7 space-y-5">
          <div>
            <label htmlFor="target_user_id" className="ui-label">
              Recipient user identifier (Email or ID)
            </label>
            <input
              id="target_user_id"
              value={targetUserId}
              onChange={(event) => setTargetUserId(event.target.value)}
              placeholder="recipient@example.com"
              className="ui-input"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="text" className="ui-label mb-0">
                Message contents
              </label>
              <span className="text-sm font-medium text-muted">{text.length}/5000</span>
            </div>
            <textarea
              id="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={12}
              maxLength={5000}
              placeholder="Paste the message content you wish to analyze..."
              className="ui-input mt-2 resize-none"
              required
            />
          </div>
        </div>

        <div className="mt-auto pt-6">
          <button type="submit" disabled={isSubmitting} className="ui-primary-button">
            <HugeiconsIcon icon={SentIcon} size={18} strokeWidth={1.9} aria-hidden />
            {isSubmitting ? "Scanning message..." : "Scan message safety"}
          </button>
        </div>
      </form>

      <section className="ui-card flex flex-col justify-between">
        <div>
          <h2 className="ui-section-title">Results and conclusion</h2>

          <div className="mt-5 space-y-5">
            <div className="ui-card-subtle text-center">
              <p className="text-sm font-bold text-ink">Submission Status</p>
              <p className="ui-metric mt-8">{trackingId ? "Received (202)" : "--"}</p>
            </div>

            <div className="ui-card-subtle text-center">
              <p className="text-sm font-bold text-ink">Scan Progress</p>
              <div className="mt-8 flex items-center justify-center gap-2 text-3xl font-bold leading-none text-ink sm:gap-3 sm:text-5xl">
                <HugeiconsIcon icon={Clock01Icon} size={32} strokeWidth={1.9} aria-hidden />
                {trackingId ? "Processing Scan" : "System Idle"}
              </div>
            </div>

            <div className={`ui-alert-block ${error ? "bg-danger" : trackingId ? "bg-success" : "bg-brand"}`}>
              {error ? "Scan Unsuccessful" : trackingId ? "Risk Scored & Logged" : "System Idle (Awaiting Input)"}
            </div>

            {trackingId ? (
              <div className="rounded-xl border border-line bg-white px-4 py-3 text-center text-sm font-medium text-muted">
                Scan Incident ID: <span className="font-bold text-ink">{trackingId}</span>
              </div>
            ) : null}

            {isFallback ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800 font-medium leading-relaxed">
                ⚠️ System operating in Fallback Mode. The incident has been temporarily logged to the local server memory.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl bg-danger px-4 py-3 text-center text-base font-bold text-white">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <h3 className="text-xl font-normal text-ink sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>
            Risk Assessment Details
          </h3>
          <p className="mt-4 text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Our system evaluates tone, aggression, targeted insults, and repeated patterns to calculate the overall message severity profile.
          </p>
        </div>
      </section>
    </div>
  );
}
