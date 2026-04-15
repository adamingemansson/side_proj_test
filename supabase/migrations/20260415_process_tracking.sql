-- Migration: Process Tracking Tables
-- Run this in your Supabase SQL editor or via supabase CLI.

-- ── processes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS processes (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             text        NOT NULL,
  slug              text,
  status            text        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active','on_hold','completed','abandoned')),
  country           text,
  jurisdiction      text,
  destination_country text,
  authority_name    text,
  source_type       text        NOT NULL DEFAULT 'ai_generated'
                                CHECK (source_type IN ('ai_generated','catalog','hybrid')),
  summary           text,
  rationale         text,
  timeline_summary  text,
  next_action       text,
  next_deadline     date,
  confidence_score  numeric(4,3),
  uncertainty_notes text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── process_steps ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS process_steps (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id         uuid        NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  order_index        integer     NOT NULL,
  title              text        NOT NULL,
  description        text,
  status             text        NOT NULL DEFAULT 'not_started'
                                 CHECK (status IN ('not_started','in_progress','completed','blocked')),
  estimated_duration text,
  target_date        date,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ── process_checklist_items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS process_checklist_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  process_step_id uuid        NOT NULL REFERENCES process_steps(id) ON DELETE CASCADE,
  label           text        NOT NULL,
  completed       boolean     NOT NULL DEFAULT false,
  item_type       text        NOT NULL DEFAULT 'action'
                              CHECK (item_type IN ('document','action','appointment','payment','other')),
  due_date        date,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_processes_user_id     ON processes(user_id);
CREATE INDEX IF NOT EXISTS idx_process_steps_process ON process_steps(process_id, order_index);
CREATE INDEX IF NOT EXISTS idx_checklist_step        ON process_checklist_items(process_step_id);

-- ── Updated_at trigger (optional but recommended) ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER processes_updated_at
  BEFORE UPDATE ON processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER process_steps_updated_at
  BEFORE UPDATE ON process_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER process_checklist_updated_at
  BEFORE UPDATE ON process_checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row-level security (service role bypasses these) ──────────────────────
ALTER TABLE processes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_steps          ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_checklist_items ENABLE ROW LEVEL SECURITY;
