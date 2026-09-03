/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface DispatchSummary {
  emergency_type: 'fire' | 'medical' | 'accident' | 'crime' | 'other'
  recommended_tab: 'FIRE' | 'POLICE' | 'MEDICAL'
  location: string[]
  nature: string[]
  /** AI video-analytics observations (e.g. visible flames, smoke). Empty for non-video demos. */
  video_observations: string[]
  people: string[]
  /** AI-derived possible interpretations (containment, spread risk, occupant visibility). Empty for non-video demos. */
  interpretations: string[]
  hazards: string[]
  units: string[]
  notes: string[]
}

export interface KnowledgeMessage {
  id: string
  role: 'operator' | 'assistant'
  content: string
  sources?: string[]
}

/**
 * One question/answer pair the knowledge-base matcher can return. The matcher
 * picks the entry whose `keywords` have the highest hit count against the
 * operator's question (case-insensitive whole-word match).
 */
export interface KnowledgeQAEntry {
  id: string
  keywords: string[]
  answer: string
  sources?: string[]
}

export interface CallerIdentity {
  caller_name: string
  caller_phone: string
  registered_address: string
  floor_level?: string
  access_notes?: string
  address_confidence: 'high' | 'medium' | 'low'
  prior_incidents_count: number
}

/**
 * Mid-call form patch tied to a transcript turn. After the turn at
 * `after_turn_index` is appended, the patch is shallow-merged into the live
 * form and `fields` (dotted-path keys) are highlighted.
 */
export interface FormUpdate {
  after_turn_index: number
  patch: DeepPartialForm
  fields: string[]
}

export type DeepPartialForm = {
  [K in keyof EmergencyCaseForm]?: Partial<EmergencyCaseForm[K]>
}

export interface Scenario {
  id: string
  name: string
  description: string
  is_demo?: boolean
  /** Discriminator: undefined or 'call' = voice call demo; 'video' = Video Analytics demo. */
  kind?: 'call' | 'video'
  /** Populated when kind === 'video'; carries the full video manifest. */
  video?: VideoScenario
  demo_transcript?: Array<{ role: 'user' | 'assistant'; content: string }>
  caller_id?: string
  demo_form?: EmergencyCaseForm
  demo_form_updates?: FormUpdate[]
  demo_dispatch_summary?: DispatchSummary
  demo_knowledge_messages?: KnowledgeMessage[]
  /** Suggested prompt chips shown when the chat is empty. */
  demo_knowledge_suggestions?: string[]
  /** Pool the matcher searches when the operator submits a question. */
  demo_knowledge_qa?: KnowledgeQAEntry[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface EmergencyCaseForm {
  where: {
    address: string
    floor_level: string
    landmarks: string
    access_notes: string
    confidence: 'high' | 'medium' | 'low'
  }
  what: {
    emergency_type: 'fire' | 'medical' | 'accident' | 'crime' | 'other'
    description: string
    severity_estimate: 'critical' | 'serious' | 'moderate' | 'minor'
  }
  who: {
    caller_name: string
    caller_phone: string
    relationship_to_emergency: string
  }
  how_many: {
    people_affected: number
    casualties_count: number
    casualties_condition: string[]
  }
  triage: {
    priority: 'P1_critical' | 'P2_urgent' | 'P3_standard'
    dispatch_services: ('police' | 'fire' | 'ambulance' | 'hazmat')[]
    rationale: string
    escalation_flags: string[]
    response_category: 'immediate' | 'rapid' | 'scheduled'
  }
  additional_info: {
    hazards: string
    caller_emotional_state: string
  }
  case_summary: string
  completeness_score: {
    where: boolean
    what: boolean
    who: boolean
    how_many: boolean
    overall_pct: number
  }
}

export interface CaseResult {
  case_form: EmergencyCaseForm | null
  case_id: string | null
}

export interface AgentConfig {
  agent_id: string
  scenario_id: string
}

// ──────────────────────────────────────────────────────────────────────────
// Video Analytics workspace types (v1)
// Schema mirrors docs/VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §5.5
// ──────────────────────────────────────────────────────────────────────────

/** Normalized [0,1] bounding box for the AI highlight overlay on V1. */
export interface AiOverlayBox {
  x: number
  y: number
  w: number
  h: number
}

export interface AiOverlay {
  box: AiOverlayBox
  label: string
}

/** Camera feed used as the primary (V1) or as a related-feed tile (V4). */
export interface CameraFeed {
  camera_id: string
  location: string
  /** URL the <video> element will load (resolved by getVideoAssetUrl). */
  source: string
  ai_overlay?: AiOverlay
  /** V4 tiles only — short copy explaining why this feed correlates. */
  correlation_reason?: string
  /** Longer AI-generated narrative shown in the V1 banner when this feed is primary. */
  ai_description?: string
  /** V4 tiles only — short evidence-signal chip (e.g. "Fire signature", "Smoke plume"). */
  evidence_signal?: string
  /** V4 tiles only — per-source AI confidence (0.00–1.00). */
  evidence_confidence?: number
}

/** Card shown in the V6 related-incidents queue. */
export interface RelatedIncident {
  cad_id: string
  badge: string
  priority: 'P1' | 'P2' | 'P3'
  type: 'FIRE' | 'MEDICAL' | 'POLICE' | 'TRAFFIC' | 'OTHER'
  title: string
  description: string
  unit: string
  eta_minutes: number
  opened_at: string
  /** AI-derived relevance score (0.00–1.00). Higher = more relevant to the primary trigger. */
  relevance?: number
  /** One-line natural-language justification for the relevance score. */
  relevance_reason?: string
}

/** Status of the AI-raised incident trigger (V0). */
export type AiTriggerStatus =
  | 'awaiting-validation'
  | 'acknowledged'
  | 'dispatched'
  | 'dismissed'

/** One source contributing to the aggregate trigger confidence. */
export interface AiTriggerEvidence {
  /** "primary" | "related-1" | "related-2" | … — keyed to feed source filenames without .mp4. */
  source: string
  confidence: number
  signal: string
}

/** AI-raised incident trigger banner data (V0). */
export interface AiTrigger {
  cad_id: string
  triggered_at: string
  classification: string
  short_location: string
  priority: 'P1' | 'P2' | 'P3'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  /** Aggregate AI confidence (0.00–1.00). */
  confidence: number
  status: AiTriggerStatus
  evidence: AiTriggerEvidence[]
}

/**
 * AI-drafted dispatch summary for the video workspace. Maps the manifest's
 * `dispatch_summary` block onto the existing DispatchSummary shape so we can
 * reuse DispatchSummaryPanel + useEditableDispatchSummary verbatim.
 */
export interface VideoDispatchSummarySections {
  location: string[]
  nature_of_emergency: string[]
  /** NEW: concise AI observations from the video feed (visible flames, smoke). */
  video_observations: string[]
  people_affected: string[]
  /** NEW: AI interpretations (possible containment, neighbouring-unit visibility). */
  interpretations: string[]
  hazards: string[]
  recommended_units: string[]
  operator_notes: string[]
}

export interface VideoDispatchSummary {
  recommended_tab: 'FIRE' | 'POLICE' | 'MEDICAL'
  sections: VideoDispatchSummarySections
}

/** Top-level video scenario, distinct from the call Scenario type. */
export interface VideoScenario {
  id: string
  kind: 'video'
  title: string
  is_demo: boolean
  /** AI-raised incident trigger that anchors the workspace (V0). */
  ai_trigger: AiTrigger
  primary_feed: CameraFeed
  related_feeds: CameraFeed[]
  related_incidents: RelatedIncident[]
  dispatch_summary: VideoDispatchSummary
}
