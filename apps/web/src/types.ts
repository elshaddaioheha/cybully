export type SeverityLevel = "low" | "medium" | "high";
export type IncidentStatus = "queued" | "analyzed" | "reviewed" | "dismissed" | "escalated";

export type Incident = {
  id: string;
  user_id: string;
  target_user_id: string;
  timestamp: string;
  text: string;
  status: IncidentStatus;
  severity_level: SeverityLevel;
  severity_score: number;
  aggression_score: number;
  intent_score: number;
  repetition_score: number;
  toxic_score: number;
  insult_score: number;
  identity_attack_score: number;
  model_name: string;
  model_version: string;
  raw_model_output: Record<string, unknown>;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type IncidentListResponse = {
  items: Incident[];
  total: number;
  limit: number;
  offset: number;
};

export type Alert = {
  id: string;
  incident_id: string;
  severity_score: number;
  recipient: string;
  payload: Record<string, unknown>;
  delivery_state: string;
  created_at: string;
};

export type AlertListResponse = {
  items: Alert[];
  total: number;
  limit: number;
  offset: number;
};

