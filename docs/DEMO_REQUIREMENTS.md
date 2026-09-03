# Demo Requirements — Emergency Dispatcher Console Walkthrough

**Document version:** 1.0
**Status:** Draft
**Owner:** Frontend / Demo
**Related app:** `mtx-call-analysis`
**Companion doc:** [docs/UI_UX_REQUIREMENTS.md](UI_UX_REQUIREMENTS.md)

---

## 1. Purpose

This document specifies a **scripted, demo-mode experience** that exercises the v1 dispatcher wireframe defined in [UI_UX_REQUIREMENTS.md §3 and §3a](UI_UX_REQUIREMENTS.md). The demo must visibly show, in a single uninterrupted flow:

1. An **incoming emergency call** with a streaming transcript appearing in the **center column** (component `C5`).
2. The **Information panel** in the **left column** (`C2`) being **auto-populated from a hardcoded caller-ID lookup** (location, phone number, name registered to the number) the moment the call connects, with additional fields filling in as the conversation progresses.
3. After the caller hangs up, an **AI-generated Dispatch Summary** rendered into the **right column, bottom half** (`C9`–`C11`), grouped under the `FIRE` / `POLICE` / `MEDICAL ASSISTANCE` tab strip.
4. A **Knowledge-base chat** in the **right column, top half** (`C7`) where the operator can ask SOP questions and receive **hardcoded canned answers** keyed to the active scenario.

The demo intentionally avoids real telephony, real CAD integration, and real RAG retrieval. It is a presentation harness; production behavior is out of scope.

---

## 2. Scope

### 2.1 In scope
- A new **Demo Mode** entry point on the existing scenario selector ([frontend/src/components/ScenarioList.tsx](../frontend/src/components/ScenarioList.tsx)).
- A **scripted call player** that streams a canned transcript into [frontend/src/components/ChatPanel.tsx](../frontend/src/components/ChatPanel.tsx) at human-readable cadence.
- A **hardcoded caller-ID directory** that maps an incoming phone number to caller name + registered address + prior-incident hint.
- An **incremental form-fill engine** that writes into the Information panel ([frontend/src/components/CaseFormPanel.tsx](../frontend/src/components/CaseFormPanel.tsx)) as transcript turns arrive.
- A **post-call summarization step** that produces a `DispatchSummaryPanel` view (new component) bound to the existing `EmergencyCaseForm` shape in [frontend/src/types/index.ts](../frontend/src/types/index.ts).
- A **`KnowledgeChatPanel`** (new component) backed by a hardcoded Q&A map for SOP lookups.

### 2.2 Out of scope (future)
- Real PSTN / WebRTC ingest.
- Real reverse-lookup to a phone carrier directory.
- Real vector / RAG retrieval for the knowledge chat (see §8).
- Multi-call queue and supervisor views (see [UI_UX_REQUIREMENTS.md §4–§7](UI_UX_REQUIREMENTS.md)).

---

## 3. Demo Flow (end-to-end)

The demo follows the v1 layout in [UI_UX_REQUIREMENTS.md §3a](UI_UX_REQUIREMENTS.md). Component IDs below (`C1`–`C11`) reference that section.

| Step | Trigger | Visible effect | Components touched |
|---|---|---|---|
| 0. Idle | Operator opens app, picks a demo scenario, clicks **Start demo call** | Three-column workspace renders; left form empty with placeholders, center shows *"Waiting for caller…"*, right shows knowledge greeting + summary empty state | `C1`–`C11` |
| 1. Ring → Connect | Auto, ~1 s after Start | Header chip in center turns to **`Active`**; caller-ID banner appears briefly; Information panel **snaps in** name, phone, address from the hardcoded directory | `C2`, `C4` |
| 2. First caller turn | Auto, ~1.5 s after connect | Caller bubble appears left-aligned in `C5`; auto-scroll engages | `C5` |
| 3. Operator turns + caller turns | Scripted, ~2–4 s between turns | Bubbles alternate; operator bubbles right-aligned; typing indicator between turns | `C5` |
| 4. Mid-call form updates | After specific transcript turns | Fields like `what.emergency_type`, `what.description`, `how_many.people_affected`, `additional_info.hazards` fade-in | `C2` |
| 5. Operator asks SOP | Manual, anytime during/after call | Operator types into `C7`; canned answer streams back from the hardcoded Q&A map; answer is tagged with the **Copilot icon** ([UI_UX_REQUIREMENTS.md §11](UI_UX_REQUIREMENTS.md)) | `C7` |
| 6. Caller hangs up | Auto, end of script | Center shows system event *"Call ended"*; **`AI generating…`** chip appears in `C10` | `C5`, `C10` |
| 7. Dispatch Summary renders | ~1–2 s after step 6 | Bullet summary populates under the active emergency tab (`FIRE` / `POLICE` / `MEDICAL ASSISTANCE`); `Dispatch` button (`C11`) becomes enabled | `C9`, `C10`, `C11` |
| 8. Operator clicks `Dispatch` | Manual | Confirmation modal per [UI_UX_REQUIREMENTS.md §3a.2](UI_UX_REQUIREMENTS.md); on confirm, summary card stamps a `Dispatched` badge | `C11` |

The flow must complete in **under 90 seconds** for a live demo, but each step's timing should be configurable.

---

## 4. Feature Requirements

### 4.1 Scripted call playback (center column, `C4`–`C6`)

- A demo scenario file (extension of the existing pattern in [data/scenarios/](../data/scenarios/)) carries:
  - `caller_id`: phone number string used as the directory lookup key.
  - `transcript[]`: ordered turns with `role` (`caller` | `operator`), `content`, and optional `delay_ms` before the turn.
  - `form_updates[]`: ordered patches (`after_turn_index`, `patch`) applied to the Information panel, where `patch` is a partial `EmergencyCaseForm` ([frontend/src/types/index.ts](../frontend/src/types/index.ts)).
  - `dispatch_summary`: the canned post-call summary object (see §4.4).
  - `knowledge_qa[]`: array of `{ match: string | RegExp-as-string, answer: string, sources?: string[] }` for the SOP chat.
- The existing `Scenario.is_demo` + `demo_transcript` fields in [frontend/src/types/index.ts](../frontend/src/types/index.ts) are extended (do not break) to hold the new fields above.
- Transcript playback reuses the `ChatPanel` rendering rules in [UI_UX_REQUIREMENTS.md §5.2](UI_UX_REQUIREMENTS.md): caller bubbles left, operator bubbles right, system events centered.
- Auto-scroll behavior matches [UI_UX_REQUIREMENTS.md §5.2](UI_UX_REQUIREMENTS.md) (stick to latest unless operator scrolled up).

### 4.2 Caller-ID auto-fill (left column, `C2`)

- A hardcoded directory module (new file `frontend/src/data/callerDirectory.ts`) exports a `Record<phoneNumber, CallerIdentity>` with at minimum:
  - `caller_name`
  - `caller_phone`
  - `registered_address` (street, unit, city, state, postal code)
  - `address_confidence` (always `"high"` for directory hits)
  - `prior_incidents_count` (integer, used to surface a non-blocking hint)
- On step 1 of the flow (§3), the demo controller patches the `EmergencyCaseForm.where` and `EmergencyCaseForm.who` blocks from the directory entry **before** any transcript turns are played.
- Auto-filled fields are visually marked with a small **`auto-filled from caller ID`** caption under the field label and remain **operator-editable** at all times. This satisfies the "operator data entry ownership" rule in [UI_UX_REQUIREMENTS.md §3a.2](UI_UX_REQUIREMENTS.md) (auto-fill is *suggested*, not committed silently).
- If the demo scenario's `caller_id` is not in the directory, the form stays empty and a muted *"Unknown number — manual entry required"* hint appears under the phone field.

### 4.3 Incremental form-fill from transcript (left column, `C2`)

- After each caller turn, the demo controller checks `form_updates[]` for entries whose `after_turn_index` matches the turn just played, and merges the `patch` into the live form state.
- Updated fields **animate** with a brief highlight (~600 ms) so the audience can see what changed.
- This is **scripted**, not LLM-driven, in v1. The patches are authored alongside the transcript.

### 4.4 Post-call Dispatch Summary (right column bottom, `C9`–`C11`)

- A new component `frontend/src/components/DispatchSummaryPanel.tsx` renders:
  - Tab strip (`FIRE` / `POLICE` / `MEDICAL ASSISTANCE`) per [UI_UX_REQUIREMENTS.md §3a.1](UI_UX_REQUIREMENTS.md). The active tab defaults to the dispatcher service implied by `triage.dispatch_services`.
  - Bullet list rendering of `dispatch_summary` with sections: *Location*, *Nature of emergency*, *People affected*, *Hazards*, *Recommended units*, *Operator notes*.
  - Copilot icon and disclosure per [UI_UX_REQUIREMENTS.md §11](UI_UX_REQUIREMENTS.md).
  - Bottom-right `Dispatch` button (`C11`) — destructive style, requires confirmation per [UI_UX_REQUIREMENTS.md §3a.2](UI_UX_REQUIREMENTS.md).
- For the demo, summary content is taken **verbatim** from the scenario's `dispatch_summary` field (no live LLM call required). The existing `api.analyzeConversation` path in [frontend/src/app/App.tsx](../frontend/src/app/App.tsx) is bypassed when `is_demo === true`.
- Empty/loading states match [UI_UX_REQUIREMENTS.md §3a.4](UI_UX_REQUIREMENTS.md): shimmer rows + `AI generating…` chip during the synthetic 1–2 s delay.

### 4.5 Knowledge-base chat (right column top, `C7`)

- A new component `frontend/src/components/KnowledgeChatPanel.tsx`.
- Greeting + suggested prompts on empty state (per [UI_UX_REQUIREMENTS.md §3a.4](UI_UX_REQUIREMENTS.md)). Suggested prompts are scenario-specific (e.g., for a fire scenario: *"What is the SOP for a high-rise structure fire?"*).
- Operator submits a question → matcher walks `knowledge_qa[]` for the active scenario and returns the first hit; if no hit, returns a fallback *"No SOP entry matched. Please consult the printed manual."*
- Returned answers stream character-by-character (~30–60 chars/sec) to feel "live".
- Every answer renders with the Copilot icon and lists `sources` as a small footer chip row when present.
- This panel is **independent of the call state**: it works before the call, during the call, and after the call.

### 4.6 Three-column layout shell

- A new `frontend/src/components/RightSplitPanel.tsx` hosts `KnowledgeChatPanel` over `DispatchSummaryPanel` per [UI_UX_REQUIREMENTS.md §12.1](UI_UX_REQUIREMENTS.md). Default split 50/50; divider draggable in v1 only if low-cost, otherwise static.
- `App.tsx` ([frontend/src/app/App.tsx](../frontend/src/app/App.tsx)) `mainLayout` becomes a true three-column flex container with the proportions in [UI_UX_REQUIREMENTS.md §3.1](UI_UX_REQUIREMENTS.md).

### 4.7 Editable Dispatch Summary (right column bottom, `C9`–`C11`)

The AI-generated dispatch summary must be treated as a **draft that the operator can amend** before it is dispatched, satisfying Acceptance Criterion 7 ("all auto-filled and AI-generated content remains operator-editable") and the human-in-the-loop principle in [UI_UX_REQUIREMENTS.md §11](UI_UX_REQUIREMENTS.md).

- **View / edit modes.** The panel ships in *view* mode (current bullet-list rendering). A small `Edit` icon button in the panel header toggles *edit* mode. While editing, the `Dispatch` button is disabled and replaced with `Save` and `Cancel` actions; closing edit mode returns control to `Dispatch`.
- **Per-section editing.** Every section (`Location`, `Nature of emergency`, `People affected`, `Hazards`, `Recommended units`, `Operator notes`) is a list of bullets. In edit mode each bullet becomes:
  - an inline `Input` (single-line) or `Textarea` (multi-line for *Operator notes*),
  - with a per-row `Remove` (×) icon button, and
  - an `Add bullet` button at the end of each section.
  Reordering within a section is supported via up/down arrow icons; full drag-and-drop is out of scope for the demo.
- **Recommended-tab override.** Operator may switch the active dispatch tab (`FIRE` / `POLICE` / `MEDICAL ASSISTANCE`); when this differs from the AI recommendation, an inline caption *"Overriding AI recommendation: <original tab>"* appears next to the tab strip.
- **Edit provenance.** Bullets the operator changed, added, or removed in the current edit session render with a subtle left border and an *"edited"* caption (mirrors the *"auto-filled from caller ID"* affordance in `C2`). The original AI text is retained in component state so an operator can revert a single bullet via a row-level **Revert** action; a panel-level **Revert all to AI draft** action restores the entire summary.
- **Validation.** Save is disabled when any required section (`Location`, `Nature of emergency`, `Recommended units`) is empty. Empty bullets are stripped on Save. No length / regex validation in v1.
- **Persistence.** In demo mode, edits live entirely in component state — they survive `Save` but are wiped on **Reset call**. A future hook (§8) describes server-side persistence.
- **Dispatch payload.** The confirmation modal triggered by `Dispatch` reflects the *edited* summary, not the AI draft. The modal lists the `Recommended units` bullets exactly as edited.
- **Audit trail (display-only in demo).** The panel exposes a passive *"Last edited by operator·‹timestamp›"* caption when any edit has occurred, so the demo can narrate the human-in-the-loop story even though no audit log is persisted.
- **Accessibility.** All edit controls are keyboard reachable in tab order; entering edit mode focuses the first bullet; `Esc` cancels.
- **State machine note.** `useDemoCall.ts` continues to own `dispatchSummary` (the AI draft). A new local component state (or a thin hook `useEditableDispatchSummary`) overlays operator edits on top of that draft and exposes both the *current* summary and the *original* AI draft for diffing and revert.

---

## 5. Demo Data Requirements

At least **three** demo scenarios shipped, one per dispatch tab:

| Scenario | Caller-ID hit? | Triggers tab | Notes |
|---|---|---|---|
| Apartment kitchen fire, single caller | Yes (known address) | `FIRE` | Demonstrates clean caller-ID auto-fill + escalating severity. |
| Traffic accident with injuries, bystander caller | Yes (bystander phone known, address from caller speech) | `MEDICAL ASSISTANCE` | Demonstrates caller-ID name/phone but **address overridden** by transcript. |
| Break-in in progress, whispered call | No (unknown number) | `POLICE` | Demonstrates the *"Unknown number — manual entry required"* path. |

Each scenario lives under [data/scenarios/](../data/scenarios/) following the existing `*.prompt.yml` convention, extended with the demo-only fields in §4.1. The backend ([backend/src/services/scenario_utils.py](../backend/src/services/scenario_utils.py)) must surface these fields without schema-validating them out.

---

## 6. Component Mapping (delta vs. existing code)

| Wireframe component | Existing | New / change |
|---|---|---|
| `C1`–`C3` Information panel + `Submit` | [CaseFormPanel.tsx](../frontend/src/components/CaseFormPanel.tsx) | Add anchored `Submit`; add per-field *auto-filled* caption; accept controlled `form` prop driven by demo controller. |
| `C4`–`C6` Conversation transcript | [TranscriptPanel.tsx](../frontend/src/components/TranscriptPanel.tsx) (replaces the legacy `ChatPanel.tsx` for demo mode) | Add caller/operator role styling, system events, typing indicator, `Active` header chip. |
| `C7` Knowledge chat | — | New `KnowledgeChatPanel.tsx`. |
| `C9`–`C11` Dispatch Summary | — | New `DispatchSummaryPanel.tsx` with view/edit modes per §4.7; backed by `useEditableDispatchSummary.ts`. |
| Right-column split | — | New `RightSplitPanel.tsx`. |
| Three-column shell | [App.tsx](../frontend/src/app/App.tsx) | Replace dialog-centric layout with always-on three-column grid for demo mode. |
| Demo controller (state machine) | — | New `frontend/src/hooks/useDemoCall.ts` orchestrating playback timing, form patches, and end-of-call summary handoff. |
| Caller-ID directory | — | New `frontend/src/data/callerDirectory.ts`. |

---

## 7. Acceptance Criteria

1. Selecting a demo scenario and clicking **Start demo call** transitions directly into the three-column workspace with no modal blocking the conversation column ([UI_UX_REQUIREMENTS.md §8](UI_UX_REQUIREMENTS.md)).
2. Within **1 s of connect**, the Information panel shows caller name, phone, and address sourced from the hardcoded directory, each marked *auto-filled from caller ID*.
3. Each scripted transcript turn appears in the center column with correct alignment (caller left, operator right) and triggers any associated form patch within **300 ms**.
4. The Knowledge chat returns a hardcoded answer for at least 3 distinct prompts per scenario, each tagged with the Copilot icon and accompanied by the responsible-AI disclosure ([UI_UX_REQUIREMENTS.md §11](UI_UX_REQUIREMENTS.md)).
5. After the final scripted turn, the Dispatch Summary populates under the correct tab within **2 s** and the `Dispatch` button becomes enabled.
6. Clicking `Dispatch` shows a confirmation modal that does **not** cover the conversation transcript ([UI_UX_REQUIREMENTS.md §3a.3](UI_UX_REQUIREMENTS.md)).
7. All auto-filled and AI-generated content remains operator-editable / dismissible.
8. Full demo (steps 0–8 in §3) completes in ≤ 90 s with default timings.
9. Keyboard-only operators can advance through the form, send a knowledge query, and trigger `Dispatch` ([UI_UX_REQUIREMENTS.md §10](UI_UX_REQUIREMENTS.md)).
10. The Dispatch Summary panel can be switched into edit mode; a bullet can be added, edited, removed, and reverted; required sections cannot be saved empty; the Dispatch confirmation reflects the edited content (§4.7).

---

## 8. Future Hooks (not built in v1 demo, but designed for)

- **Real caller-ID lookup**: replace `callerDirectory.ts` with a backend endpoint (`GET /api/caller/{phone}`) returning the same `CallerIdentity` shape.
- **Live form-fill via LLM**: replace scripted `form_updates[]` with a streaming extractor that reuses the prompts in [data/scenarios/](../data/scenarios/) `*-evaluation.prompt.yml` against the rolling transcript.
- **Real SOP RAG**: replace the `knowledge_qa[]` matcher with a retrieval call; preserve the `{ answer, sources[] }` response shape so the UI does not change.
- **Real audio**: re-enable the existing `useRecorder` / `useRealtime` path in [App.tsx](../frontend/src/app/App.tsx) for non-demo scenarios; demo mode and live mode coexist behind the `is_demo` flag.
- **Persisted dispatch-summary edits + audit log**: ship the §4.7 edits to a backend endpoint (`PATCH /api/cases/{id}/dispatch-summary`) that records each diff against the AI draft (operator id, timestamp, before/after text) for downstream review and model fine-tuning.

---

## 9. Open Questions

- Should the demo controller expose a **playback speed** control (1×, 2×, 4×) for rehearsals, or keep timing fixed?
- Should the Dispatch confirmation log a fake CAD ticket number for added realism, or stay UI-only?
- For the *Unknown number* scenario, do we want to demo a manual reverse-lookup tool the operator can click, or leave it as pure manual entry?
- Should the Knowledge chat persist across scenarios in a single session, or reset on each new demo call?
- For §4.7, should an operator's edits to the dispatch summary be allowed to flow *back* into the Information panel (`C2`) form, or must the two views diverge intentionally once edited?
- Should the demo expose a side-by-side *AI draft vs. operator-edited* diff view (toggleable from the panel header), or is the per-bullet *edited* affordance sufficient for v1?
