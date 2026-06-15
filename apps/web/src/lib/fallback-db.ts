import type { Incident, Alert, IncidentStatus, SeverityLevel, IncidentListResponse, AlertListResponse } from "@/types";

// Simple offensive keywords for local heuristic scanning
const TOXIC_KEYWORDS = ["kill", "hate", "idiot", "loser", "waste", "garbage", "trash", "stupid", "ugly", "dumb", "shut up", "worst"];
const INSULT_KEYWORDS = ["idiot", "loser", "stupid", "ugly", "dumb", "jerk", "moron"];
const AGGRESSION_KEYWORDS = ["kill", "destroy", "beat", "smash", "punch", "hurt", "die", "destroy you"];
const IDENTITY_KEYWORDS = ["gay", "lesbian", "trans", "black", "jew", "immigrant", "foreigner"];

// Helper to generate UUIDs locally
function generateUUID(): string {
  return "fallback-uuid-" + Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15);
}

class FallbackDatabase {
  private incidents: Incident[] = [];
  private alerts: Alert[] = [];
  private initialized = false;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;

    // Create 4 initial mock incidents
    const now = new Date();
    
    // Incident 1: High severity, already reviewed
    const inc1Id = "fallback-inc-1";
    this.incidents.push({
      id: inc1Id,
      user_id: "user_alpha@example.com",
      target_user_id: "user_beta@example.com",
      timestamp: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      text: "You are a complete waste of space, get lost and never come back. Everyone hates you and you should just disappear.",
      status: "reviewed",
      severity_level: "high",
      severity_score: 0.88,
      aggression_score: 0.85,
      intent_score: 0.90,
      repetition_score: 0.75,
      toxic_score: 0.95,
      insult_score: 0.92,
      identity_attack_score: 0.10,
      model_name: "Heuristic Scorer (Local Fallback)",
      model_version: "v1.0.0-fallback",
      raw_model_output: {},
      review_note: "Confirmed severe toxicity and harassment. Flagged for action.",
      reviewed_by_user_id: "mock-moderator-id",
      reviewed_by_email: "pascaladerinola082@gmail.com",
      moderated_at: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
    });

    // High severity incident also creates an alert
    this.alerts.push({
      id: "fallback-alert-1",
      incident_id: inc1Id,
      severity_score: 0.88,
      recipient: "moderation@example.com",
      payload: { text: "You are a complete waste of space..." },
      delivery_state: "delivered",
      created_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    });

    // Incident 2: Medium severity, analyzed but not reviewed
    const inc2Id = "fallback-inc-2";
    this.incidents.push({
      id: inc2Id,
      user_id: "harasser@example.com",
      target_user_id: "victim@example.com",
      timestamp: new Date(now.getTime() - 1.5 * 3600 * 1000).toISOString(),
      text: "Stop posting your garbage on this forum. You are stupid and nobody cares about your opinions.",
      status: "analyzed",
      severity_level: "medium",
      severity_score: 0.58,
      aggression_score: 0.45,
      intent_score: 0.60,
      repetition_score: 0.50,
      toxic_score: 0.70,
      insult_score: 0.75,
      identity_attack_score: 0.05,
      model_name: "Heuristic Scorer (Local Fallback)",
      model_version: "v1.0.0-fallback",
      raw_model_output: {},
      review_note: null,
      reviewed_by_user_id: null,
      reviewed_by_email: null,
      moderated_at: null,
      created_at: new Date(now.getTime() - 1.5 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1.5 * 3600 * 1000).toISOString(),
    });

    // Incident 3: Low severity, analyzed (false alarm or benign)
    this.incidents.push({
      id: "fallback-inc-3",
      user_id: "tester@example.com",
      target_user_id: "developer@example.com",
      timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      text: "This is a normal message checking if the system handles clean text without any toxicity or bullying markers.",
      status: "analyzed",
      severity_level: "low",
      severity_score: 0.08,
      aggression_score: 0.05,
      intent_score: 0.10,
      repetition_score: 0.0,
      toxic_score: 0.05,
      insult_score: 0.02,
      identity_attack_score: 0.02,
      model_name: "Heuristic Scorer (Local Fallback)",
      model_version: "v1.0.0-fallback",
      raw_model_output: {},
      review_note: null,
      reviewed_by_user_id: null,
      reviewed_by_email: null,
      moderated_at: null,
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    });

    // Incident 4: High severity, identity attack, escalated
    const inc4Id = "fallback-inc-4";
    this.incidents.push({
      id: inc4Id,
      user_id: "aggressor@example.com",
      target_user_id: "target_user@example.com",
      timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      text: "You don't belong here, go back to where you came from, you dirty foreigner. We will make you leave.",
      status: "escalated",
      severity_level: "high",
      severity_score: 0.85,
      aggression_score: 0.80,
      intent_score: 0.85,
      repetition_score: 0.40,
      toxic_score: 0.88,
      insult_score: 0.82,
      identity_attack_score: 0.95,
      model_name: "Heuristic Scorer (Local Fallback)",
      model_version: "v1.0.0-fallback",
      raw_model_output: {},
      review_note: "Extreme xenophobic abuse. Escalate to platform administrators for immediate ban.",
      reviewed_by_user_id: "mock-moderator-id",
      reviewed_by_email: "pascaladerinola082@gmail.com",
      moderated_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    });

    this.alerts.push({
      id: "fallback-alert-2",
      incident_id: inc4Id,
      severity_score: 0.85,
      recipient: "moderation@example.com",
      payload: { text: "You don't belong here, go back..." },
      delivery_state: "delivered",
      created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    });
  }

  public listIncidents(query?: URLSearchParams): IncidentListResponse {
    this.ensureInitialized();
    let filtered = [...this.incidents];

    if (query) {
      const severity = query.get("severity");
      const status = query.get("status");
      
      if (severity) {
        filtered = filtered.filter(inc => inc.severity_level === severity);
      }
      if (status) {
        filtered = filtered.filter(inc => inc.status === status);
      }
    }

    // Sort by created_at desc
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const limit = query?.get("limit") ? parseInt(query.get("limit")!, 10) : 25;
    const offset = query?.get("offset") ? parseInt(query.get("offset")!, 10) : 0;
    const items = filtered.slice(offset, offset + limit);

    return {
      items,
      total: filtered.length,
      limit,
      offset,
    };
  }

  public getIncident(id: string): Incident | null {
    this.ensureInitialized();
    return this.incidents.find(inc => inc.id === id) || null;
  }

  public updateIncident(
    id: string,
    status: IncidentStatus,
    reviewNote: string | null,
    reviewerUser: { id: string; email: string | null }
  ): Incident | null {
    this.ensureInitialized();
    const index = this.incidents.findIndex(inc => inc.id === id);
    if (index === -1) return null;

    const existing = this.incidents[index]!;
    const updated: Incident = {
      ...existing,
      status,
      review_note: reviewNote,
      reviewed_by_user_id: reviewerUser.id,
      reviewed_by_email: reviewerUser.email,
      moderated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.incidents[index] = updated;
    return updated;
  }

  public listAlerts(query?: URLSearchParams): AlertListResponse {
    this.ensureInitialized();
    // Sort by created_at desc
    const sorted = [...this.alerts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const limit = query?.get("limit") ? parseInt(query.get("limit")!, 10) : 25;
    const offset = query?.get("offset") ? parseInt(query.get("offset")!, 10) : 0;
    const items = sorted.slice(offset, offset + limit);

    return {
      items,
      total: this.alerts.length,
      limit,
      offset,
    };
  }

  public analyzeText(text: string, targetUserId: string, userId: string): { tracking_id: string; status: "accepted" } {
    this.ensureInitialized();
    const incidentId = generateUUID();
    const now = new Date().toISOString();

    const lowerText = text.toLowerCase();
    
    // Heuristic scoring based on keyword occurrences
    let toxicHits = 0;
    TOXIC_KEYWORDS.forEach(kw => { if (lowerText.includes(kw)) toxicHits++; });
    
    let insultHits = 0;
    INSULT_KEYWORDS.forEach(kw => { if (lowerText.includes(kw)) insultHits++; });

    let aggressionHits = 0;
    AGGRESSION_KEYWORDS.forEach(kw => { if (lowerText.includes(kw)) aggressionHits++; });

    let identityHits = 0;
    IDENTITY_KEYWORDS.forEach(kw => { if (lowerText.includes(kw)) identityHits++; });

    // Calculate score boundaries
    const toxic_score = Math.min(1.0, toxicHits * 0.25 + (toxicHits > 0 ? 0.2 : 0));
    const insult_score = Math.min(1.0, insultHits * 0.3 + (insultHits > 0 ? 0.15 : 0));
    const aggression_score = Math.min(1.0, aggressionHits * 0.35 + (aggressionHits > 0 ? 0.15 : 0));
    const identity_attack_score = Math.min(1.0, identityHits * 0.4 + (identityHits > 0 ? 0.15 : 0));

    // Repetition check: count previous incidents by this user to the same target
    const prevCount = this.incidents.filter(inc => inc.user_id === userId && inc.target_user_id === targetUserId).length;
    const repetition_score = Math.min(1.0, prevCount * 0.25);

    // Intent check: combination of aggression + repetitions
    const intent_score = Math.min(1.0, aggression_score * 0.6 + repetition_score * 0.4);

    // Overall Severity score weights (analogous to python config)
    // risk_weight_intent = 0.25, risk_weight_repetition = 0.25, risk_weight_aggression = 0.5
    const severity_score = intent_score * 0.25 + repetition_score * 0.25 + aggression_score * 0.5;

    let severity_level: SeverityLevel = "low";
    if (severity_score >= 0.7) {
      severity_level = "high";
    } else if (severity_score >= 0.4) {
      severity_level = "medium";
    }

    const incident: Incident = {
      id: incidentId,
      user_id: userId,
      target_user_id: targetUserId,
      timestamp: now,
      text,
      status: "analyzed",
      severity_level,
      severity_score,
      aggression_score,
      intent_score,
      repetition_score,
      toxic_score,
      insult_score,
      identity_attack_score,
      model_name: "Heuristic Scorer (Local Fallback)",
      model_version: "v1.0.0-fallback",
      raw_model_output: {},
      review_note: null,
      reviewed_by_user_id: null,
      reviewed_by_email: null,
      moderated_at: null,
      created_at: now,
      updated_at: now,
    };

    this.incidents.push(incident);

    // If high severity, create an alert
    if (severity_level === "high") {
      this.alerts.push({
        id: "fallback-alert-" + Math.random().toString(36).substring(2, 9),
        incident_id: incidentId,
        severity_score,
        recipient: "moderation@example.com",
        payload: { text: text.substring(0, 40) + "..." },
        delivery_state: "delivered",
        created_at: now,
      });
    }

    return {
      tracking_id: incidentId,
      status: "accepted"
    };
  }
}

// Global instance to persist data across requests during server runtime
const globalForFallback = global as unknown as { fallbackDb?: FallbackDatabase };
export const fallbackDb = globalForFallback.fallbackDb || new FallbackDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForFallback.fallbackDb = fallbackDb;
}
