create table if not exists incidents (
  id varchar(36) primary key,
  user_id varchar(255) not null,
  target_user_id varchar(255) not null,
  timestamp timestamptz not null,
  text text not null,
  status varchar(32) not null default 'queued',
  severity_level varchar(32) not null,
  severity_score double precision not null,
  aggression_score double precision not null,
  intent_score double precision not null,
  repetition_score double precision not null,
  toxic_score double precision not null,
  insult_score double precision not null,
  identity_attack_score double precision not null,
  model_name varchar(128) not null,
  model_version varchar(128) not null,
  raw_model_output jsonb not null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_incidents_user_id on incidents (user_id);
create index if not exists ix_incidents_target_user_id on incidents (target_user_id);
create index if not exists ix_incidents_timestamp on incidents (timestamp);
create index if not exists ix_incidents_status on incidents (status);
create index if not exists ix_incidents_severity_level on incidents (severity_level);
create index if not exists ix_incidents_severity_score on incidents (severity_score);
create index if not exists ix_incidents_user_target_timestamp
  on incidents (user_id, target_user_id, timestamp);

create table if not exists alerts (
  id varchar(36) primary key,
  incident_id varchar(36) not null,
  severity_score double precision not null,
  recipient varchar(255) not null,
  payload jsonb not null,
  delivery_state varchar(32) not null default 'stubbed',
  created_at timestamptz not null default now()
);

create index if not exists ix_alerts_incident_id on alerts (incident_id);

