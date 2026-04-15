import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) throw new Error("SUPABASE_URL is not set");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

/** Server-side Supabase client using the service role key.
 *  Never expose this to the browser. */
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// ── Row types ──────────────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  drive_folder_id: string | null;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  user_id: string;
  drive_file_id: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
}

// Process tracking tables

export type ProcessStatus = "active" | "on_hold" | "completed" | "abandoned";
export type ProcessSourceType = "ai_generated" | "catalog" | "hybrid";
export type ProcessStepStatus = "not_started" | "in_progress" | "completed" | "blocked";
export type ChecklistItemType = "document" | "action" | "appointment" | "payment" | "other";

export interface ProcessRow {
  id: string;
  user_id: string;
  title: string;
  slug: string | null;
  status: ProcessStatus;
  country: string | null;
  jurisdiction: string | null;
  destination_country: string | null;
  authority_name: string | null;
  source_type: ProcessSourceType;
  summary: string | null;
  rationale: string | null;
  timeline_summary: string | null;
  next_action: string | null;
  next_deadline: string | null;
  confidence_score: number | null;
  uncertainty_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessStepRow {
  id: string;
  process_id: string;
  order_index: number;
  title: string;
  description: string | null;
  status: ProcessStepStatus;
  estimated_duration: string | null;
  target_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessChecklistItemRow {
  id: string;
  process_step_id: string;
  label: string;
  completed: boolean;
  item_type: ChecklistItemType;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Full process with nested steps and checklist items — used in API responses */
export interface ProcessRowWithSteps extends ProcessRow {
  steps: (ProcessStepRow & { checklist_items: ProcessChecklistItemRow[] })[];
}
