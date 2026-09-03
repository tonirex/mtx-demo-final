# UI/UX Requirements — Video Analytics Dispatcher Workspace

**Document version:** 1.1
**Status:** Reconciled with implementation (April 2026)
**Owner:** Frontend / UX
**Related app:** `mtx-call-analysis` (emergency-call dispatcher console — Video Analytics module)
**Companion docs:** [UI_UX_REQUIREMENTS.md](UI_UX_REQUIREMENTS.md), [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md), [VIDEO_ANALYTICS_DEMO_SCRIPT.md](VIDEO_ANALYTICS_DEMO_SCRIPT.md)

> **v1.1 reconciliation note.** This revision realigns the doc with the shipped implementation in [VideoFeedWorkspace.tsx](../frontend/src/components/VideoFeedWorkspace.tsx). Three structural changes were made: (1) the **related-incidents queue (V6) lives in the right column**, not the bottom-left, with the right column split vertically into V6 (top) over V8 (bottom); (2) the **related-feeds grid (V4) spans the full width** of the left column's bottom band — there is no left-column horizontal split; (3) two new components are documented — **V12 AI description line** above the primary feed and **V13 contextual chips** in the feed-selected banner.

---

## 1. Purpose

Define the user-interface and user-experience requirements for the **Video Analytics dispatcher workspace** — the AI-initiated counterpart to the voice-call workspace specified in [UI_UX_REQUIREMENTS.md](UI_UX_REQUIREMENTS.md).

Where the call workspace is driven by an **inbound caller**, the video workspace is driven by a **CCTV alerting agent** that has already opened a CAD record, classified the incident, and correlated nearby feeds. The UI's job is therefore not to *capture* information from a caller but to **let the operator validate, corroborate, and dispatch on AI-raised evidence** — quickly, transparently, and with the human firmly in the loop.

The reference v1 wireframe is a **two-column workspace** with the **left column vertically split** into a primary live feed (top) and a bottom band shared by a related-feeds grid and a related-incidents queue. The right column hosts the AI-drafted Dispatch Summary.

This document is the authoritative UI/UX reference for component design, implementation, and acceptance testing of the Video Analytics module.

---

## 2. Personas & Primary Goals

| Persona | Goal | Key needs |
|---|---|---|
| **Dispatcher (primary)** | Validate AI-raised CCTV alerts and dispatch the right responders fast | One-glance triage, explainable AI evidence, editable dispatch packet, undo-friendly controls |
| **Supervisor (secondary)** | See which incidents AI raised, what was dismissed, and what was dispatched | Visible status pills, audit-friendly state transitions on V0 |
| **Video analytics agent (AI)** | Surface a high-confidence trigger with corroborating evidence and a draft dispatch packet | Clear AI affordances, per-source confidence, responsible-AI disclosure, never auto-dispatches |

---

## 3. Overall Layout

The Video Analytics workspace uses a **two-column primary layout**. The active call workspace's three-column layout is **not** reused — there is no live conversation channel. The left column owns the **video / evidence** stack; the right column owns the **incident-context + AI artifact** stack.

```
┌──────────────────────────────────────────────┬───────────────────────────┐
│  LEFT COLUMN (65 %)                          │  RIGHT COLUMN (35 %)       │
│  ────────────────────────────────────────    │  ─────────────────────     │
│  V0 — AI Trigger Banner                      │  V6 — Related-incidents    │
│  (CAD ID · P1 · HIGH SEVERITY · confidence · │  queue                     │
│   3 validation actions · status pill)        │  Header: "Possible related │
│                                              │  incidents"                │
├──────────────────────────────────────────────┤  [card] [card] [card] …    │
│  V2 — Feed-selected banner                   │  (max ~40 % of column;     │
│  (location · Camera No · V13 chips ·         │   click → V11 side drawer) │
│   AI highlight badge)                        │                            │
│  V12 — AI description line                   ├───────────────────────────┤
│  ────────────────────────────────────────    │  V7 — Dispatch Summary      │
│  V1 — Primary live feed (with V3 overlay)    │  tab strip                 │
│  (~60 % of left column height)               │  (FIRE / POLICE /          │
│                                              │   MEDICAL ASSISTANCE)      │
├──────────────────────────────────────────────┤  • Trigger-metadata strip  │
│  V5 — Corroborating-sources caption          │  • V8 sectioned bullets    │
│  + aggregate-confidence strip                │    (scroll)                │
│  V4 — Related feeds grid (FULL WIDTH)        │  • V10 edit controls       │
│  [feed 1] [feed 2] [feed 3]                  │  • Responsible-AI          │
│  (~40 % of left column height)               │    disclosure              │
│                                              │  [ Dispatch ] (V9, BR)     │
└──────────────────────────────────────────────┴───────────────────────────┘
```

> **Reset demo button.** A single `Reset demo` control is absolutely positioned in the **top-right corner** of the workspace (above the right column) once the demo has started. It is small, secondary-styled, and does not occupy column space.

### 3.1 Column proportions (desktop ≥ 1100 px)

| Zone | Width | Height | Scroll |
|---|---|---|---|
| Left column | 65 fr | full viewport | — |
| Right column | 35 fr | full viewport | — (children scroll) |
| V0 AI Trigger Banner | 100 % of left | auto (≈ 96–140 px) | — |
| V1 Primary feed + V2 banner + V12 (left middle row) | 100 % of left | ~60 % of remaining left height (`60fr`) | — |
| V4 Related-feeds grid + V5 caption (left bottom row) | 100 % of left | ~40 % of remaining left height (`40fr`) | Vertical if overflow |
| V6 Related-incidents queue (right top) | 100 % of right | up to 40 % of right column (min 200 px) | Vertical |
| V8 Dispatch Summary (right bottom) | 100 % of right | fills remaining right-column height | Vertical |

### 3.2 Vertical placement within each column

- **Left column (top-to-bottom):** V0 AI Trigger Banner → V2 feed-selected banner (with V13 chips) → V12 AI description line → V1 primary feed (with V3 overlay) → V5 caption + aggregate-confidence strip → V4 related-feeds grid (full width).
- **Right column (top-to-bottom):** V6 related-incidents queue (capped at ~40 % of column height) → V7 tab strip → V8 trigger-metadata strip → V8 sectioned bullet content (scroll) → V10 edit controls in the V8 header → V9 `Dispatch` button anchored bottom-right.

### 3.3 General rules

- Each zone is an **independent, vertically scrollable panel** separated by 1 px borders + spacing.
- **Primary actions** (`Acknowledge & dispatch`, `Dispatch`) are anchored to the bottom or right edge of their owning panel.
- **The primary feed (V1) must remain visible** at all times during an active alert. Modals and the side drawer (V11) **never** cover V1.
- **Tab strips** sit at the top of the panel they control (V7 for the Dispatch Summary).
- Layout is **responsive**: below **1100 px** (the breakpoint used by [VideoFeedWorkspace.tsx](../frontend/src/components/VideoFeedWorkspace.tsx)), the workspace collapses to a single column — left-column zones render first, the right column (V6 then V8) stacks below them, and the page scrolls vertically.
- The related-feeds grid (V4) collapses from a 3-column row to a single column below ~900 px (handled inside [RelatedFeedsGrid.tsx](../frontend/src/components/RelatedFeedsGrid.tsx)).
- No primary navigation requires leaving the workspace during an active alert.

---

## 3a. Core Component Placement (V1 Video Analytics Wireframe)

This section pins down **where each core component lives** in the v1 layout. It is the authoritative placement reference. Component IDs `V0`–`V13` are used throughout this document.

### 3a.1 Component map

| # | Component | Zone | Vertical zone | Anchored? |
|---|---|---|---|---|
| V0 | AI Trigger Banner (CAD ID, P1/HIGH SEVERITY chips, classification, confidence, status pill, validation actions) | Top of left column | Top | Fixed |
| V1 | Primary feed video player | Left column, middle row | Below V0/V2/V12 | Fixed aspect ratio |
| V2 | Feed-selected banner (`Selected feed: <location> · Camera No: <id>`) | Left column, middle row | Above V1, below V0 | Fixed |
| V3 | AI highlight overlay (SVG rectangle + label chip) on V1 | Layered over V1 | Layered over V1 | — |
| V4 | Related-feeds grid (3 thumbnails) | Left column, bottom row | Below V5 strip | — |
| V5 | Corroborating-sources caption + subline + aggregate-confidence strip | Left column, bottom row | Above V4 | — |
| V6 | Related-incidents queue (header *"Possible related incidents"* + relevance-ranked cards) | **Right column, top** | Top of right column (capped ~40 %) | — |
| V7 | Dispatch Summary tab strip (`FIRE` / `POLICE` / `MEDICAL ASSISTANCE`) | Right column, bottom | Top of V8 panel | Fixed |
| V8 | AI-generated Dispatch Summary content (sectioned bullets, with trigger-metadata strip on top) | Right column, bottom | Middle (scroll) | — |
| V9 | `Dispatch` action button | Right column, bottom | Bottom-right of V8 panel | Fixed to panel footer |
| V10 | `Edit` / `Save` / `Cancel` controls | Right column, bottom | Header row of V8 (next to tabs) | Fixed |
| V11 | Incident detail side drawer | Overlay above right column | Slides in from right | Dismissible |
| V12 | **AI description line** (single-line plain-language description of what the AI sees in the current primary feed) | Left column, middle row | Below V2 banner, above V1 player | Fixed |
| V13 | **Contextual chips inside V2** — `correlation_reason` chip (when present) and `AI highlight` badge (when V3 overlay is present) | Right side of V2 banner | — | — |

### 3a.2 Placement rules

- **AI Trigger Banner (V0) sits above V1** within the left column (not full-width across both columns) and is always visible after step 0.5. It frames the entire workspace as *"validate this AI-raised alert."*
- **Left column owns the live alerting channel and its evidence.** V1 must remain visible during the demo; never covered by modals or the side drawer. V4 (related feeds) lives directly under V1 in the **same column** at full column width — there is no horizontal split inside the left column.
- **Right column is split vertically** between V6 (top, capped at ~40 % of column height with a 200 px minimum) and V8 (bottom, fills remaining height). The split is intentional: V6 answers *"is this connected to anything else in the queue?"*; V8 answers *"what should I dispatch?"*
- **AI description line (V12)** sits between the V2 banner and the V1 player. It is rendered with a brand-accent left border and a Copilot icon to mark its provenance. It updates whenever the primary feed changes (post-promote).
- **V13 chips** appear at the right edge of the V2 banner: a `correlation_reason` chip when the active primary feed has one (typically only the originally-primary feed has none) and an `AI highlight` badge whenever V3 overlay metadata is present.
- **Promote-to-primary.** Clicking any V4 thumbnail promotes it to V1; the previously primary feed demotes into the same V4 slot. The swap reuses the V1 `<video>` element (no full re-mount) by mutating `src` only, and completes in **≤ 300 ms**.
- **Side drawer (V11)** is the only overlay surface in v1. It anchors to the right edge and overlays **V6, V7, V8, and V9** (the entire right column). It does **not** overlay V0, V1, V4, or V12 (the entire left column remains interactive).
- **Primary action buttons** are bottom- or right-anchored within their owning panel: `Acknowledge & dispatch` (V0, right of banner), `Dispatch` (V9, bottom-right of V8).
- **Destructive actions** (`Dismiss as false positive` in V0, `Dispatch` in V9) use the destructive color token and require confirmation.

### 3a.3 Z-order and overlays

1. Base layout (two columns; left column 3 stacked rows; right column V6 over V8).
2. V3 AI highlight overlay (SVG rect + label chip) over V1.
3. V4 hover-preview state (mp4 swap on a single tile).
4. V12 AI description line (in normal flow, above V1).
5. Tab content within V8.
6. Tooltips, dropdowns, autocomplete.
7. Reset demo button (top-right of workspace).
8. V11 side drawer (overlays the entire right column).
9. Confirmation modals (`Dismiss as false positive`, `Dispatch`) — Fluent UI `Dialog` rendered on top of everything; **must not cover V1**.

### 3a.4 Empty / loading states per component

| Component | Empty state | Loading state |
|---|---|---|
| V0 AI Trigger Banner | Hidden during the `idle` phase (Start overlay covers the workspace) | `Awaiting trigger…` chip with shimmer for the confidence value during the `connecting` phase |
| V1 Primary feed | n/a — always has a feed assigned | Black frame with spinner + caption *"Connecting to Camera <id>…"* until phase ≠ `connecting`/`trigger-raised` |
| V2 + V12 | n/a | Banner is rendered with placeholder text; V12 hides when the active feed has no `ai_description` |
| V4 Related feeds | *"No correlated feeds"* | 3 skeleton tiles |
| V5 Caption + aggregate strip | Caption falls back to *"AI highlight related feed based on proximity and activity"* when no trigger; aggregate strip is hidden | Renders once `trigger` is available |
| V6 Incident queue | *"No related incidents"* | 3 skeleton rows |
| V8 Dispatch Summary | *"Summary will appear once video analytics has enough context."* | Shimmer bullet rows + `AI generating…` chip with Copilot icon |
| V11 Side drawer | n/a (only opens on demand) | Synthetic load (~300 ms) before populated content appears |

---

## 4. Panel Detail — V0 AI Trigger Banner

**Purpose:** Frame the entire workspace as an AI-raised, human-validated incident. This is the single most important UI affordance in the video workspace because it carries the responsible-AI contract: the AI has classified, but the human decides.

### 4.1 Structure

- **Header line:** `🤖  AI INCIDENT TRIGGER · <cad_id>` followed by a **priority chip** (`P1` / `P2` / `P3`) and **severity chip** rendered as `HIGH SEVERITY` / `MEDIUM SEVERITY` / `LOW SEVERITY` (severity word is suffixed with the literal text *SEVERITY* in v1).
- **Subline:** classification + short location (e.g. *"Likely residential fire — Blk 84 Commonwealth Crescent #08-12"*).
- **Metadata row:** `Detected <hh:mm:ss> · Confidence <0.00–1.00> · <N> corroborating sources`. Confidence is rendered statically (no count-up animation in v1).
- **Status pill (right-anchored):** `Awaiting validation` (default) → `Acknowledged` → `Dispatched`. Terminal state: `Dismissed`.
- **Validation actions (left-aligned beneath the metadata row):**
  - `Acknowledge & dispatch` — primary/brand-styled.
  - `Request more evidence` — secondary, no-op stub in v1 (narration hook).
  - `Dismiss as false positive` — destructive-styled, opens confirmation modal.

### 4.2 States

| Status pill | V0 visual | Side effects |
|---|---|---|
| `Awaiting validation` | Default brand accent | All three validation actions enabled |
| `Acknowledged` | Success color | Acknowledge button disabled; focus moves to V8; V9 button briefly halos |
| `Dispatched` | Success color, stamped | Acknowledge & Dispatch disabled; V9 stamps `Dispatched` badge on V8 |
| `Dismissed` | Muted/destructive | Workspace returns to step-0 empty/loading states (V1, V4, V6, V8) |

### 4.3 Affordances

- Carries the **Copilot icon** (the entire trigger is AI-generated).
- Responsible-AI disclosure ([UI_UX_REQUIREMENTS.md §11](UI_UX_REQUIREMENTS.md)) is visible in the right column near V8; V0 does not duplicate the disclosure but its actions enforce it.
- All three validation buttons are keyboard-reachable with visible focus states.

---

## 5. Panel Detail — Primary Feed (V1, V2, V3)

**Purpose:** Show the **single source of truth** the AI is most confident about, with the AI's own bounding box layered on top so the operator can verify the claim in one glance.

### 5.1 Player (V1)

- `<video>` element with default attributes: `muted`, `loop`, `playsInline`, `autoplay`. No native browser controls in v1; a single overlay `Pause / Play` affordance is acceptable.
- Source mp4 declared in the scenario manifest (`primary_feed.source`).
- Fixed aspect ratio (16:9 in v1). Letterboxed if the asset differs.
- A small **Copilot icon** in a corner marks the feed as having AI overlay metadata.

### 5.2 Feed-selected banner (V2)

- Copy: `Selected feed: <feed.location> · Camera No: <feed.camera_id>`.
- Always visible directly above V1 (with V12 sitting between V2 and V1).
- Right side of the banner hosts **V13 chips**: a `correlation_reason` chip (when present) and an `AI highlight` badge (when V3 overlay metadata is present). Both chips carry the Copilot icon.
- Updates when a related feed is promoted (§3a.2).

### 5.3 AI highlight overlay (V3)

- Static SVG rectangle layered over V1, accompanied by a small **label chip** in the top-left of the video (e.g. *"Active fire detected"*) with the Copilot icon.
- Stroke color: warm orange (`#ff7a00` in the current implementation) — chosen for high contrast against typical CCTV scenes; see [§12](#12-visual-design-tokens-delta-vs-ui_ux_requirementsmd-9) note.
- Coordinates: normalized box `{ x, y, w, h }` in `[0,1]` from the manifest.
- The label chip carries the overlay's `label` text and acts as the non-color cue per [§10](#10-accessibility-requirements).
- Hidden when the promoted primary has no overlay metadata; the V13 `AI highlight` badge in V2 is also hidden in that case.

### 5.4 AI description line (V12)

- Renders between V2 and V1 as a single-line block with a brand-accent left border and a Copilot icon.
- Format: `AI description: <feed.ai_description>` — bold prefix followed by the AI-generated plain-language description of what the AI sees in the active primary feed (e.g. *"Active fire detected — bright orange flames emerging from a mid-floor unit window…"*).
- Hidden when the active feed has no `ai_description` field in the manifest.
- Updates whenever a related feed is promoted to primary.

---

## 6. Panel Detail — Related Feeds Grid (V4, V5)

**Purpose:** Show **why the AI is confident** by surfacing the corroborating cameras and their per-source contributions to the aggregate confidence number.

### 6.1 Caption (V5)

- Renders above V4 with the Copilot icon.
- Primary line: *"Corroborating sources · AI cross-referenced these feeds to raise trigger confidence to <aggregate>."*
- Subline: *"Each source independently shows fire/smoke or evacuation activity consistent with the primary alert."*

### 6.2 Aggregate-confidence strip

- Sits between V5 and V4.
- Compact single line listing each source with its individual confidence and the resulting aggregate. Source labels are derived from the manifest's `ai_trigger.evidence[].source` field via a generic transform (`primary` → `Primary`; `related-1` → `Source 1`; etc.), e.g.:
  `Primary 0.91  +  Source 1 0.88  +  Source 2 0.79  +  Source 3 0.72   →   Aggregate 0.94`.
- Static (no animation) in v1.
- *(Future hook: replace generic `Source N` labels with human-readable labels (Corridor / Carpark / Void deck) once the manifest carries a `display_label` field per evidence entry.)*

### 6.3 Tiles (V4)

Each tile must display:

- Thumbnail/poster (defaults to `poster:` from manifest).
- Hover state: muted mp4 preview (no audio).
- Caption: camera ID + 1-line correlation reason.
- **Evidence-signal chip** (corner badge): e.g. *Fire signature*, *Smoke plume*, *Evacuation activity*.
- **Per-source confidence value** (0.00–1.00).
- A small **left accent stripe** in the AI-accent color so the tile reads as *evidence*, not just *a camera*.

### 6.4 Interactions

- **Click promotes to primary.** The previously primary feed swaps into the same V4 slot. Promotion completes in **≤ 300 ms** (reuse V1 `<video>` element by swapping `src`).
- **Hover** triggers the mp4 preview on that tile only.
- Each tile carries an `aria-label` describing the correlation reason and evidence signal — non-color cue per [§10](#10-accessibility-requirements).

---

## 7. Panel Detail — Related Incidents Queue (V6, V11)

**Purpose:** Answer *"is this connected to anything else?"* by surfacing nearby pending CAD records ranked by AI relevance, each with a one-line *Why related* explanation.

> **Placement note.** V6 lives in the **top of the right column**, capped at ~40 % of column height (with a 200 px minimum). It is **not** in the left column. The header is *"Possible related incidents"*.

### 7.1 Cards (V6)

Each card displays:

- `PENDING` badge (top-left).
- Priority chip (`P1` / `P2` / `P3`) and incident type (`FIRE` / `POLICE` / `MEDICAL`).
- Dispatch action label (e.g. *"Dispatch Traffic Police patrol to CAD-2026-00182"*).
- CAD ID, short description, assigned unit, ETA.
- `View Call →` link.
- **AI relevance score:** small horizontal bar (filled portion proportional to score) + numeric value (0.00–1.00), with the Copilot icon. Bar fill ramps from neutral (low) to AI-accent (high).
- **Why related** line: one-line AI reasoning (e.g. *"same block · 2 floors above · ≤ 3 min apart"*).

### 7.2 Sort & state

- Default sort: relevance score descending.
- *(Future hook: a `Sort: relevance ▼` control to toggle ordering.)*
- Cards are visually distinct from V4 tiles — **no thumbnail, CAD-style framing**.
- Empty queue shows the empty-state copy in [§3a.4](#3a4-empty--loading-states-per-component).

### 7.3 Side drawer (V11)

- Opens on click of any V6 card.
- Slides in from the right edge with a 200 ms transition.
- **Overlays the entire right column** (V6, V7, V8, V9). The left column (V0, V1, V4, V12) remains fully interactive.
- Header: CAD ID, close (`✕`) button. Dismissible via `Esc`.
- Body sections: *Summary*, *Location*, *Assigned units*, *Timeline*, *Notes*.
- Footer actions:
  - `Cross-reference with current alert` — no-op stub in v1 (narration hook).
  - `Open full record` — disabled (future hook for routed page).

---

## 8. Panel Detail — AI Dispatch Summary (V7, V8, V9, V10)

**Purpose:** Present the AI-drafted dispatch packet, **fully editable** by the operator, with explicit provenance back to the trigger and evidence. This panel is where the AI hands the keys back to the human.

### 8.1 Tab strip (V7)

- Identical to [UI_UX_REQUIREMENTS.md §3a.1](UI_UX_REQUIREMENTS.md): `FIRE` / `POLICE` / `MEDICAL ASSISTANCE`.
- Active tab defaults to the value declared in the manifest's `dispatch_summary.recommended_tab`.
- Tabs switch the V8 *content* only; never affect V0, V1, V4, or V6.

### 8.2 Trigger-metadata strip

- Sits above V8's section list.
- Static text: *"Drafted from <cad_id> · AI-triggered · <priority> · <N> corroborating sources"*.
- Ties the summary back to V0 so anyone reading the packet later knows which evidence underpins it.

### 8.3 Sections (V8)

- Renders the manifest's `dispatch_summary.sections[]` as bulleted lists.
- The full section list (per [useEditableDispatchSummary.ts](../frontend/src/hooks/useEditableDispatchSummary.ts)) is, in render order:
  1. **Location** (*required*)
  2. **Nature of emergency** (*required*)
  3. **AI video observations** — plain-language, frame-by-frame style observations from the video analytics agent (e.g. *"Bright orange and yellow flames actively emerging from a window/balcony opening"*).
  4. **Possible AI interpretations** — what the AI thinks the observations mean / candidate hypotheses.
  5. **People affected**
  6. **Hazards**
  7. **Recommended units** (*required*)
  8. **Operator notes**
- Required sections (*Location*, *Nature of emergency*, *Recommended units*) cannot be saved empty.
- The **first bullet** of *Nature of emergency* is the AI classification line, e.g. *"Likely residential fire (AI classifier confidence 0.94)"* — editable like any other but carries an inline AI badge to mark its provenance.
- The *AI video observations* and *Possible AI interpretations* sections both carry the Copilot icon at the section heading to mark them as predominantly AI-generated.
- Carries the **Copilot icon** and the responsible-AI disclosure ([UI_UX_REQUIREMENTS.md §11](UI_UX_REQUIREMENTS.md)).

### 8.4 Edit controls (V10) and lifecycle

V10 controls and the entire view/edit lifecycle **reuse [DEMO_REQUIREMENTS.md §4.7](DEMO_REQUIREMENTS.md) verbatim**, including:

- View / edit modes, per-bullet inputs, add/remove/reorder.
- Edit provenance (left border + *"edited"* caption).
- Per-row Revert and panel-level *Revert all to AI draft*.
- Validation: Save disabled if Location, Nature of emergency, or Recommended units is empty; empty bullets stripped on Save.
- Audit caption *"Last edited by operator · ‹timestamp›"*.
- Keyboard reachability and `Esc` cancels edit.

### 8.5 Dispatch action (V9)

- **Destructive-styled** ([UI_UX_REQUIREMENTS.md §9](UI_UX_REQUIREMENTS.md)).
- Anchored bottom-right of the right column.
- **Disabled while V8 is in edit mode.**
- Always gated by a confirmation modal that lists the **edited** *Recommended units* verbatim.
- On confirm: V8 stamps a `Dispatched` badge; V0 status pill flips to `Dispatched`.

---

## 9. Cross-Cutting UX Patterns

| Pattern | Requirement |
|---|---|
| **Information density via columns** | All zones visible simultaneously on desktop; no modal blocks V1. |
| **AI-initiated, human-validated** | V0 frames the entire workspace; nothing dispatches without explicit operator action. |
| **Explainable AI evidence** | V4 per-source confidence + aggregate strip; V6 *Why related* line; V8 trigger-metadata strip. |
| **Status pills** | V0 status pill (`Awaiting validation` / `Acknowledged` / `Dispatched` / `Dismissed`) is the canonical state indicator. |
| **Inline AI affordances** | Copilot icon on V0, V3 (label chip), V5, V6 (relevance scores), V8 (panel + section headings for AI video observations / Possible AI interpretations), V12 (AI description line), V13 chips (AI highlight, correlation reason). |
| **Destructive action isolation** | `Dismiss as false positive` (V0) and `Dispatch` (V9) use destructive color, are spatially separated from safe controls, and require confirmation. |
| **Empty states with onboarding** | Every zone has both an empty and a loading state (see [§3a.4](#3a4-empty--loading-states-per-component)). |
| **Promote-to-primary** | Any V4 tile can become V1 in ≤ 300 ms without remounting the player. |
| **Drawer-not-modal for context** | V11 is a side drawer, not a modal — it never covers V1. |

---

## 10. Accessibility Requirements

- **WCAG 2.1 AA** compliance.
- All color-coded indicators (priority/severity chips, relevance bars, evidence-signal chips, status pill) include a **non-color cue** (icon, label, shape, or numeric value).
- Full **keyboard navigation**:
  - V0 validation actions are tab-reachable; `Enter` activates; `Esc` cancels confirmation modals.
  - V4 tiles are tab-reachable; `Enter` promotes; `Space` toggles hover-preview.
  - V6 cards are tab-reachable; `Enter` opens the V11 side drawer.
  - V11 side drawer traps focus while open; `Esc` dismisses.
  - V10 edit controls follow the keyboard contract from [DEMO_REQUIREMENTS.md §4.7](DEMO_REQUIREMENTS.md).
- **Screen reader** labels:
  - V0 announces classification, priority, severity, confidence, and current status pill.
  - V3 overlay announces the AI label (e.g. *"AI highlight: Active fire detected"*).
  - V4 tiles announce the correlation reason, evidence signal, and per-source confidence.
  - V6 cards announce the relevance score and *Why related* reason.
  - All AI-generated regions are announced as *"AI generated"*.
- **Focus states** visible on every interactive element.
- Minimum **contrast ratio 4.5:1** for text; 3:1 for chips and bars.
- Live regions announce V0 state transitions (`Awaiting validation` → `Acknowledged` → `Dispatched` / `Dismissed`) and the *AI generating…* → *summary populated* transition on V8.
- Hover-only previews on V4 tiles must have a keyboard equivalent (`Space` toggles).

---

## 11. Responsible AI Requirements

- All AI-generated content (V0 trigger, V3 overlay + label chip, V5 caption, V6 relevance scores, V8 summary including the *AI video observations* and *Possible AI interpretations* sections, V12 AI description line, V13 chips) is **visually labeled** with the Copilot icon.
- A persistent disclosure (*"AI-generated content may be incorrect…"*) appears in the right column near V8.
- The operator must be able to **edit, dismiss, or revert** AI suggestions:
  - V0 → `Dismiss as false positive`.
  - V8 → full edit lifecycle per [DEMO_REQUIREMENTS.md §4.7](DEMO_REQUIREMENTS.md).
- The system **never auto-dispatches**. V0 actions are explicit, V9 confirmation is mandatory.
- **Provenance is always visible**:
  - V8 trigger-metadata strip ties the packet back to V0.
  - The AI classification line in V8 carries an inline AI badge with confidence.
  - Edit provenance on V8 distinguishes operator edits from AI draft (left border + *"edited"* caption).
- State transitions on V0 (`Acknowledged`, `Dispatched`, `Dismissed`) are the audit surface — every video incident's lifecycle is visible at a glance.

---

## 12. Visual Design Tokens (delta vs. UI_UX_REQUIREMENTS.md §9)

The video workspace **reuses** the design tokens defined in [UI_UX_REQUIREMENTS.md §9](UI_UX_REQUIREMENTS.md). The additions below are video-specific.

| Token | Usage | Example |
|---|---|---|
| `color.priority.p1` | P1 chip (V0, V6) | Destructive red |
| `color.priority.p2` | P2 chip | Amber |
| `color.priority.p3` | P3 chip | Neutral |
| `color.severity.high` | HIGH chip (V0) | Destructive red |
| `color.severity.medium` | MEDIUM chip | Amber |
| `color.severity.low` | LOW chip | Neutral |
| `color.status.awaiting` | V0 `Awaiting validation` pill | Brand accent |
| `color.status.acknowledged` | V0 `Acknowledged` pill | Success green |
| `color.status.dispatched` | V0 `Dispatched` pill, V8 dispatched badge | Success green (stamped) |
| `color.status.dismissed` | V0 `Dismissed` pill | Muted gray |
| `color.evidence.fire` | *Fire signature* chip on V4 tile | Destructive red tint |
| `color.evidence.smoke` | *Smoke plume* chip | Amber tint |
| `color.evidence.evacuation` | *Evacuation activity* chip | Brand purple tint |
| `color.relevance.bar.low` | V6 relevance bar fill (low scores) | Neutral |
| `color.relevance.bar.high` | V6 relevance bar fill (high scores) | `color.ai.accent` |
| `radius.feed-tile` | V4 tile corners | 6 px |
| `radius.banner` | V0 banner corners | 8 px |
| `spacing.right-col-gutter` | Between V6 and V8 in the right column | 12 px |
| `color.overlay.highlight` | V3 SVG rectangle stroke | Warm orange (`#ff7a00`) — currently a hard-coded literal; should be promoted to a token in a future pass. |

---

## 13. Component Mapping to Existing Codebase

| Wireframe component | File | Status |
|---|---|---|
| Scenario entry | [frontend/src/components/ScenarioList.tsx](../frontend/src/components/ScenarioList.tsx) | Implemented — renders `kind: video` scenarios alongside call scenarios. |
| Video workspace shell | [frontend/src/components/VideoFeedWorkspace.tsx](../frontend/src/components/VideoFeedWorkspace.tsx) | Implemented — two-column grid `65fr 35fr`; left column `auto 60fr 40fr` rows; right column flex-column with V6 capped at 40 % over V8. |
| V0 AI Trigger Banner | [frontend/src/components/AiTriggerBanner.tsx](../frontend/src/components/AiTriggerBanner.tsx) | Implemented — status pill + 3 validation actions wired through `useVideoDemo`. |
| V1 / V2 / V3 / V12 / V13 Primary feed | [frontend/src/components/PrimaryFeedPanel.tsx](../frontend/src/components/PrimaryFeedPanel.tsx) | Implemented — `<video>` element reused across promotions (src-swap only); V12 AI description and V13 chips render in the banner. |
| V4 / V5 Related feeds grid | [frontend/src/components/RelatedFeedsGrid.tsx](../frontend/src/components/RelatedFeedsGrid.tsx) | Implemented — full-width inside the left column's bottom row; hover-preview, click-to-promote, evidence chips, aggregate strip with `Source N` labels. |
| V6 Related incidents queue | [frontend/src/components/IncidentQueuePanel.tsx](../frontend/src/components/IncidentQueuePanel.tsx) | Implemented — header *"Possible related incidents"*, sorted by relevance desc, relevance bar + *Why related* line. |
| V7 / V8 / V9 / V10 Dispatch Summary | [frontend/src/components/DispatchSummaryPanel.tsx](../frontend/src/components/DispatchSummaryPanel.tsx) + [frontend/src/hooks/useEditableDispatchSummary.ts](../frontend/src/hooks/useEditableDispatchSummary.ts) | Implemented — sections include `video_observations` and `interpretations` in addition to the call-workspace baseline. |
| V11 Incident detail drawer | [frontend/src/components/IncidentDetailDrawer.tsx](../frontend/src/components/IncidentDetailDrawer.tsx) | Implemented. |
| Demo controller | [frontend/src/hooks/useVideoDemo.ts](../frontend/src/hooks/useVideoDemo.ts) | Implemented — orchestrates step timings and exposes `phase`, `trigger`, `triggerStatus`, `primary`, `related`, `incidents`, `summary`, etc. |
| Trigger-metadata strip | inlined in [VideoFeedWorkspace.tsx](../frontend/src/components/VideoFeedWorkspace.tsx) | Implemented — rendered above `<DispatchSummaryPanel>` when `trigger && summary`. |
| Reset demo button | inlined in [VideoFeedWorkspace.tsx](../frontend/src/components/VideoFeedWorkspace.tsx) | Implemented — absolutely positioned top-right with `z-index: 50`. |
| Scenario loader | [backend/src/services/scenario_utils.py](../backend/src/services/scenario_utils.py) | Surfaces `kind: video` scenarios; passes manifest fields through unchanged. |

---

## 14. Acceptance Criteria (high level)

1. A 1440 px wide desktop renders V0, V1, V4, V6, V8, V12 simultaneously without horizontal scrolling.
2. V0 is always visible while a video scenario is active and shows the CAD ID, priority chip, severity chip (rendered as `<LEVEL> SEVERITY`), classification, short location, detection timestamp, aggregate confidence, corroborating-source count, status pill, and three validation actions.
3. V1 plays the primary mp4 muted/looped within 2 s of Start; V2 banner shows the camera ID and location; V12 AI description line renders below V2 when the active feed has `ai_description`; V3 highlight rectangle + label chip are visible when the active feed has overlay metadata; V13 `AI highlight` badge appears in V2 in that case.
4. Clicking any V4 tile promotes it to V1 in ≤ 300 ms **without remounting the `<video>` element** (only the `src` attribute is mutated); the previously primary feed swaps into the same V4 slot; V2 banner, V12 description, V13 chips, and V3 overlay all update for the new primary.
5. V4 tiles each carry an evidence-signal chip and per-source confidence; the aggregate-confidence strip with `Source N` labels is rendered above the grid; V5 caption carries the Copilot icon. V4 spans the **full width** of the left column's bottom row.
6. V6 lives in the **top of the right column** with the header *"Possible related incidents"*, capped at ~40 % of the right column with a 200 px minimum. Cards are sorted by AI relevance descending; each carries a relevance bar + numeric value + *Why related* line; clicking a card opens V11 in ≤ 250 ms.
7. V11 overlays the **entire right column** (V6 + V7 + V8 + V9); the entire left column (V0, V1, V4, V12) remains interactive while V11 is open; `Esc` and the `✕` button both dismiss V11.
8. V8 includes — in order — *Location*, *Nature of emergency*, *AI video observations*, *Possible AI interpretations*, *People affected*, *Hazards*, *Recommended units*, *Operator notes*. V8 carries the trigger-metadata strip, the AI classification first bullet under *Nature of emergency*, the Copilot icon, and the responsible-AI disclosure; *Location*, *Nature of emergency*, and *Recommended units* cannot be saved empty; the Dispatch confirmation reflects the edited content.
9. V0 status pill transitions correctly: `Awaiting validation` → `Acknowledged` (on `Acknowledge & dispatch`, which also smooth-scrolls focus to V8 and briefly halos V9) → `Dispatched` (on V9 confirm), or `Awaiting validation` → `Dismissed` (on `Dismiss as false positive` confirm). Dismissal returns the workspace to step-0 empty/loading states.
10. V9 is destructive-styled, anchored bottom-right of V8, disabled while V8 is in edit mode, and always requires confirmation.
11. All interactive elements (V0 actions, V4 tiles, V6 cards, V10 controls, V11 drawer, V9 button, Reset demo) are reachable and operable by keyboard alone with visible focus states.
12. All AI-generated artifacts (V0, V3, V5, V6 relevance scores, V8 panel + AI-only section headings, V12, V13) carry the Copilot icon; the responsible-AI disclosure is visible in the right column.
13. Priority, severity, evidence signal, and relevance are all distinguishable without relying on color alone (chips carry text labels; bars carry numeric values).
14. Below 1100 px the workspace collapses to a single column (left zones first, then right zones); the page scrolls vertically and no zone is lost.

---

## 15. Out of Scope (v1)

- Real computer-vision inference (object detection, fire/smoke classification).
- Real camera-grid ingest (RTSP / WebRTC).
- Real cross-feed correlation engine.
- Routed `/incidents/{id}` deep-link page (V11 side drawer is the v1 affordance; a routed page is a future hook).
- Cross-link from the voice-call workspace (an inbound 999 call escalating into the video workspace).
- Supervisor analytics dashboards over V0 state transitions.
- Multi-operator collaboration / handoff UI for video incidents.
- Per-feed audio playback (every feed plays muted in v1).

---

## 16. Open Questions

- Should V0 expose a *"View raw detection log"* affordance for advanced users, or keep the banner narrative-focused in v1?
- When the operator promotes a V4 tile that has no overlay metadata, should the V3 highlight clear silently or surface an explicit *"No AI overlay for this feed"* caption?
- What is the desired behavior of `Request more evidence` (V0) in v2 — query adjacent cameras, page additional units, or call back the reporting party?
- Should the V11 side drawer support a "compare with primary" split view in a future iteration?
- Confirmation pattern for `Dispatch` (V9) — modal vs. inline two-step (consistency with the call workspace's `End` button pattern)?
