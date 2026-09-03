# Demo Requirements — Video Analytics Dispatcher Workspace

**Document version:** 1.0
**Status:** Draft
**Owner:** Frontend / Demo
**Related app:** `mtx-call-analysis`
**Companion docs:** [docs/UI_UX_REQUIREMENTS.md](UI_UX_REQUIREMENTS.md), [docs/DEMO_REQUIREMENTS.md](DEMO_REQUIREMENTS.md)

---

## 1. Purpose

This document specifies a **scripted, demo-mode experience** for a new **Video Analytics** module in the dispatcher console. Where the call-demo in [docs/DEMO_REQUIREMENTS.md](DEMO_REQUIREMENTS.md) is driven by an inbound voice call, this module is driven by a **CCTV alerting agent** that has flagged a primary camera feed (apartment on fire) and correlated three nearby feeds by **location and activity**.

The workspace must visibly demonstrate, in a single uninterrupted flow:

0. An **AI-raised incident trigger** (top of left column, above the primary feed) showing that the video analytics agent has opened a CAD record (e.g. *CAD-2026-00210*), triaged it as **P1 / HIGH severity / likely residential fire**, and is **awaiting operator validation** with explicit `Acknowledge & dispatch` / `Request more evidence` / `Dismiss as false positive` actions.
1. A **selected primary live feed** (top-left) showing the alerting incident, with an **AI-drawn highlight rectangle** marking the area of interest.
2. A **related-feeds grid** (bottom-left) of three correlated CCTV thumbnails, framed as **corroborating evidence** that raises the trigger's confidence — each with an evidence-signal chip and per-source confidence.
3. A **related-incidents queue** (bottom-right) of nearby pending CAD-style cases, each carrying an **AI relevance score** (0.00–1.00) and a one-line *Why related* explanation.
4. An **AI-generated Dispatch Summary** (right column) drafted from the video analytics output, **operator-editable** before dispatch.

The demo intentionally avoids real CV inference, real camera ingest, and real CAD integration. It is a presentation harness; production behavior is out of scope.

---

## 2. Scope

### 2.1 In scope
- A new **demo scenario** card in [frontend/src/components/ScenarioList.tsx](../frontend/src/components/ScenarioList.tsx) labeled e.g. *"Video: Apartment fire — Blk 84 Commonwealth Crescent"*.
- A new **Video Analytics workspace** layout (three functional zones, see §3) that replaces the call-demo's three-column layout when a video scenario is launched.
- An **AI Trigger Banner** (V0) above the primary feed that surfaces the AI-raised CAD incident, its triage (priority, severity, classification), aggregate confidence, and operator validation actions.
- A scripted **primary feed** with a static AI overlay rectangle and a feed-selected banner.
- A **related-feeds grid** of three correlated thumbnails with hover/click behavior, evidence-signal chips, per-source confidence, and an aggregate-confidence strip.
- A **related-incidents queue** of canned CAD entries with AI relevance scores and *Why related* explanations; clicking an entry opens a **side drawer** with details.
- An **AI-drafted Dispatch Summary** prefilled from the scenario manifest, reusing the editable summary spec in [docs/DEMO_REQUIREMENTS.md §4.7](DEMO_REQUIREMENTS.md), with a trigger-metadata strip and an *AI classification* line.
- A **video scenario manifest** schema and on-disk asset layout under `data/video-scenarios/`.

### 2.2 Out of scope (future)
- Real computer-vision inference (object detection, fire/smoke classification).
- Real camera grid ingest (RTSP/WebRTC).
- Real cross-feed correlation engine.
- Routed `/incidents/{id}` deep-link page (the side drawer is the v1 affordance; route is a future hook).
- Cross-link from the voice-call demo (an inbound 999 call escalating into the video workspace).

---

## 3. Overall Layout

The Video Analytics workspace uses a **two-column primary layout** with the **left column vertically split**, mapped from the user's reference mockup. The active call-demo's three-column layout is **not** reused; the right column hosts the AI artifact stack instead of a live conversation.

```
┌──────────────────────────────────────────────┬───────────────────────────┐
│  TOP-LEFT — Primary live feed                │  RIGHT — AI-generated      │
│  (selected camera)                           │  Dispatch Summary          │
│                                              │  (FIRE / POLICE /          │
│  • Feed-selected banner                      │   MEDICAL ASSISTANCE tabs) │
│  • AI highlight rectangle                    │                            │
│  • Camera ID + location caption              │  • View / edit modes       │
│                                              │    per DEMO_REQUIREMENTS   │
│                                              │    §4.7                    │
├──────────────────────────────────────────────┤                            │
│  BOTTOM-LEFT — Related feeds grid            │                            │
│  [feed 1] [feed 2] [feed 3]                  │                            │
│  "AI-correlated by location and activity"    │                            │
├──────────────────────────────────────────────┤                            │
│                                              │                            │
│                                              │  [ Dispatch ] (anchored)   │
│                                              │                            │
│  BOTTOM-RIGHT inside left column —           │                            │
│  Related incidents queue                     │                            │
│  [incident card]…  → opens side drawer       │                            │
└──────────────────────────────────────────────┴───────────────────────────┘
```

> **Note.** "BOTTOM-RIGHT" in the user's mockup is positioned within the **left** column's bottom band, beside the related-feeds grid. On screens narrower than 1440 px the related-feeds grid and the incidents queue stack vertically inside the left column.

### 3.1 Column proportions (desktop ≥ 1440 px)
| Zone | Width | Height | Scroll |
|---|---|---|---|
| Left column | 65 % | full | — |
| Right column | 35 % | full | — |
| Primary feed (top of left) | 100 % of left | ~55 % of viewport height | — |
| Related-feeds grid (bottom-left of left) | ~50 % of left | ~45 % of viewport height | Vertical if overflow |
| Related-incidents queue (bottom-right of left) | ~50 % of left | ~45 % of viewport height | Vertical |
| Dispatch Summary | 100 % of right | fills column | Vertical |

### 3.2 General rules
- The **primary feed must remain visible** at all times during an active alert; never overlaid by modals (mirrors [UI_UX_REQUIREMENTS.md §3a.3](UI_UX_REQUIREMENTS.md) for the conversation transcript).
- All AI-generated artifacts (highlight rectangle, related-feed correlation captions, dispatch summary) carry the **Copilot icon** and the responsible-AI disclosure ([UI_UX_REQUIREMENTS.md §11](UI_UX_REQUIREMENTS.md)).
- The `Dispatch` action is **destructive-styled** and requires confirmation ([UI_UX_REQUIREMENTS.md §3a.2](UI_UX_REQUIREMENTS.md)).
- The side drawer (V5) overlays only the **right column**, never the primary feed.

---

## 3a. Core Component Placement (V1 Video Analytics Wireframe)

This is the authoritative placement reference for the video workspace. Component IDs `V1`–`V11` are used throughout this document.

### 3a.1 Component map

| # | Component | Zone | Vertical zone | Anchored? |
|---|---|---|---|---|
| V0 | AI Trigger Banner (CAD ID, P1/HIGH/classification, confidence, validation actions, status pill) | Top-left | Above V2 (top of left column) | Fixed |
| V1 | Primary feed video player | Top-left | Top of left column | Fixed aspect ratio |
| V2 | Feed-selected banner (`Selected feed: location <name> Camera No: <id>`) | Top-left | Above V1 (below V0) | Fixed |
| V3 | AI highlight overlay (rectangle) on V1 | Top-left | Layered over V1 | — |
| V4 | Related-feeds grid (3 thumbnails) | Bottom-left, left half | Top of zone | — |
| V5 | Related-feeds caption (*"AI highlight related feed based on proximity and activity"*) | Bottom-left, left half | Above V4 | — |
| V6 | Related-incidents queue (list of cards) | Bottom-left, right half | Top → bottom of zone | — |
| V7 | Dispatch Summary tab strip (`FIRE` / `POLICE` / `MEDICAL ASSISTANCE`) | Right column | Top | Fixed |
| V8 | AI-generated Dispatch Summary content (sectioned bullets) | Right column | Middle (scroll) | — |
| V9 | `Dispatch` action button | Right column | Bottom-right | Fixed to column footer |
| V10 | `Edit` / `Save` / `Cancel` controls (per [DEMO_REQUIREMENTS.md §4.7](DEMO_REQUIREMENTS.md)) | Right column | Header row of V8 | Fixed |
| V11 | Incident detail side drawer | Overlay above right column | Slides in from right | Dismissible |

### 3a.2 Placement rules
- **AI Trigger Banner (V0) sits above V1** within the left column (not full-width across both columns) and is always visible while the workspace is active. It frames the entire workspace as *"validate this AI-raised alert."*
- **Top-left owns the live alerting channel.** It must remain visible during the demo; never covered by modals or drawers.
- **Bottom-left is split.** Related-feeds grid (V4) sits beside the related-incidents queue (V6). On narrower screens, V4 and V6 stack vertically with V4 on top.
- **Right column owns the AI artifact** and its edit affordances.
- **Side drawer (V11)** is the only overlay surface in v1. It anchors to the right edge and overlays the right column (Dispatch Summary). It does **not** overlay the primary feed.
- **Promote-to-primary.** Clicking any related-feed thumbnail (V4) promotes it to V1; the previously primary feed demotes into the grid in the same slot.

### 3a.3 Empty / loading states
| Component | Empty state | Loading state |
|---|---|---|
| V0 AI Trigger Banner | n/a (always present in a video scenario) | `Awaiting trigger…` chip with shimmer for confidence value |
| V1 Primary feed | *"No feed selected"* placeholder | Black frame with spinner |
| V4 Related feeds | *"No correlated feeds"* | Skeleton tiles |
| V6 Incident queue | *"No related incidents"* | Skeleton rows |
| V8 Dispatch Summary | *"Summary will appear once video analytics has enough context."* | Shimmer bullet rows + `AI generating…` chip with Copilot icon |
| V11 Side drawer | n/a (only opens on demand) | Skeleton fields while loading canned data (~300 ms synthetic delay) |

---

## 4. Demo Flow (end-to-end)

Component IDs below reference §3a. Timing values are defaults and must be configurable.

| Step | Trigger | Visible effect | Components touched |
|---|---|---|---|
| 0. Idle | Operator opens app, picks the *Video: Apartment fire — Blk 84 Commonwealth Crescent* scenario, clicks **Start demo** | Two-column workspace renders. V0 banner shows `Awaiting trigger…` shimmer. V1 black frame with *"Connecting to Camera 042895…"*, V4 / V6 skeletons, V8 shows *"Summary will appear once video analytics has enough context."* | All |
| 0.5. AI trigger raised | Auto, ~0.5 s after Start | V0 banner snaps into its `Awaiting validation` state: CAD ID, **P1**, **HIGH**, *"Likely residential fire — Blk 84 Commonwealth Crescent #08-12"*, detection timestamp, aggregate confidence (e.g. `0.94`), corroborating-source count, and the three validation actions (`Acknowledge & dispatch` / `Request more evidence` / `Dismiss as false positive`). Carries Copilot icon | V0 |
| 1. Primary feed connects | Auto, ~1 s after Start | V1 begins playing the primary mp4 (muted, looped). V2 banner appears with location + camera ID. **V3 AI highlight rectangle** fades in over the apartment window of interest | V1, V2, V3 |
| 2. Related feeds appear | Auto, ~2 s after step 1 | V4 thumbnails populate (autoplay muted on hover, static poster otherwise). V5 caption *"Corroborating sources · AI cross-referenced these feeds to raise trigger confidence to 0.94"* appears with Copilot icon. Each tile shows an evidence-signal chip (e.g. *Fire signature*, *Smoke plume*, *Evacuation activity*) and per-source confidence. The aggregate-confidence strip above the grid shows the per-source breakdown. | V4, V5 |
| 3. Related incidents populate | Auto, ~2.5 s after step 1 | V6 fills with 3 canned related-incident cards (PENDING / Dispatch-Agent style), each with an **AI relevance score** (0.00–1.00) shown as a horizontal bar + numeric value, and a one-line *Why related* explanation. Cards are sorted by relevance descending | V6 |
| 4. Dispatch summary drafts | Auto, ~3 s after step 1 | `AI generating…` chip appears in V8; ~1.5 s later the bullet sections fade in (Location, Nature of emergency, People affected, Hazards, Recommended units, Operator notes). V7 tab strip defaults to **FIRE**. V8 header shows a trigger-metadata strip (*"Drafted from CAD-2026-00210 · AI-triggered · P1 · 4 corroborating sources"*). The first bullet of *Nature of emergency* is the AI classification line (*"Likely residential fire (AI classifier confidence 0.94)"*) | V0, V7, V8 |
| 5. Operator promotes a related feed | Manual, anytime | Operator clicks any V4 thumbnail → it becomes V1; previous V1 swaps into V4 slot. V2 banner updates. V3 highlight is hidden unless the new primary has overlay metadata | V1, V2, V3, V4 |
| 6. Operator opens an incident | Manual | Operator clicks a V6 card → V11 side drawer slides in from the right with incident details (CAD ID, type, address, units, ETA, brief log). Drawer overlays V7–V9 only | V6, V11 |
| 7. Operator edits the summary | Manual | Operator clicks **Edit** in V10. V8 enters edit mode per [DEMO_REQUIREMENTS.md §4.7](DEMO_REQUIREMENTS.md): per-bullet inputs, add/remove/reorder, edit provenance, revert. V9 disabled while editing | V8, V9, V10 |
| 7.5. Operator validates the trigger | Manual | Operator clicks `Acknowledge & dispatch` in V0. Status pill flips from `Awaiting validation` → `Acknowledged`, focus moves to V8, V9 button briefly highlights to draw attention. Alternatively `Dismiss as false positive` opens a confirmation modal; on confirm, status pill flips to `Dismissed` and the workspace returns to step 0 | V0, V8, V9 |
| 8. Operator dispatches | Manual | Operator clicks V9 → confirmation modal listing edited *Recommended units*; on confirm, summary card stamps a `Dispatched` badge and V0 status pill flips to `Dispatched` | V0, V8, V9 |

End-to-end demo (steps 0–8) must complete in **≤ 90 s**.

---

## 5. Feature Requirements

### 5.0 AI Trigger Banner (V0)
- Sits above V1 within the left column. Always visible while a video scenario is active.
- Carries the Copilot icon and the responsible-AI disclosure ([UI_UX_REQUIREMENTS.md §11](UI_UX_REQUIREMENTS.md)) since the entire trigger is AI-generated.
- Header line: `🤖  AI INCIDENT TRIGGER · <cad_id>` followed by **priority** chip (e.g. `P1`) and **severity** chip (e.g. `HIGH`). Severity chip uses the destructive/warning color token.
- Subline: classification (e.g. *"Likely residential fire"*) + short location (e.g. *"Blk 84 Commonwealth Crescent #08-12"*).
- Metadata row: `Detected <hh:mm:ss> · Confidence <0.00–1.00> · <N> corroborating sources`. Confidence value is rendered statically (no count-up animation in v1).
- **Status pill** anchored to the right of the banner. States: `Awaiting validation` (default after step 0.5) → `Acknowledged` → `Dispatched`, with `Dismissed` as a terminal state.
- **Validation actions** (3 buttons, right-aligned beneath the metadata row):
  - `Acknowledge & dispatch` — primary/brand-styled. On click: status pill → `Acknowledged`, focus moves to V8 Dispatch Summary, V9 button highlights briefly. Disabled once status is `Acknowledged`, `Dispatched`, or `Dismissed`.
  - `Request more evidence` — secondary. No-op stub in v1 (narration hook for *"would query adjacent cameras / call back the reporting party"*). Always enabled while status is `Awaiting validation`.
  - `Dismiss as false positive` — destructive-styled. Opens a confirmation modal that lists the trigger summary; on confirm, status pill → `Dismissed` and the workspace resets to step 0 (V1/V4/V6/V8 return to their empty/loading states).
- All actions are keyboard-reachable with visible focus states.
- Empty / loading state: shimmer for the confidence value with an `Awaiting trigger…` chip in place of the status pill (used during the ~0.5 s window between Start and step 0.5).

### 5.1 Primary feed (V1, V2, V3)
- V1 plays an mp4 from the scenario manifest. Default attributes: `muted`, `loop`, `playsInline`, `autoplay`. No native browser controls in v1 (presentation-only); a single **`Pause / Play`** affordance overlay is acceptable.
- V2 banner copy: `Selected feed: location <feed.location> Camera No: <feed.camera_id>`. Fonts and spacing per [UI_UX_REQUIREMENTS.md §9](UI_UX_REQUIREMENTS.md).
- V3 AI highlight is a **static SVG rectangle** layered over V1, with stroke color `color.ai.accent` (per [UI_UX_REQUIREMENTS.md §9](UI_UX_REQUIREMENTS.md)). Coordinates come from the manifest as a normalized box `{ x, y, w, h }` in `[0,1]`. *Future hook: timeline-driven boxes.*
- A small **Copilot icon** appears at the corner of V1 to mark the highlight as AI-generated.

### 5.2 Related feeds grid (V4, V5)
- V4 renders **exactly three** thumbnails in a single row (desktop) or 1×3 stacked (narrow). Each tile shows: thumbnail/poster, short caption (camera ID + 1-line correlation reason), an **evidence-signal chip** (e.g. *Fire signature*, *Smoke plume*, *Evacuation activity*) in a corner, a **per-source confidence** value (0.00–1.00), and a hover state that previews the mp4 muted.
- V5 caption renders above V4 with the Copilot icon and reads: *"Corroborating sources · AI cross-referenced these feeds to raise trigger confidence to <aggregate>."* with a subline: *"Each source independently shows fire/smoke or evacuation activity consistent with the primary alert."*
- **Aggregate-confidence strip** sits between V5 and V4: a single compact line listing each source with its individual confidence and the resulting aggregate, e.g. `Primary 0.91  +  Corridor 0.88  +  Carpark 0.79  +  Void deck 0.72   →   Aggregate 0.94`. Static (no animation) in v1.
- Tiles render with a subtle evidence-card frame (small left accent stripe in the AI-accent color) so they read as *evidence*, not just *cameras*.
- **Click promotes to primary** (step 5 in §4). The previously primary feed swaps into the same slot. The promotion must complete in **≤ 300 ms** (no full re-mount of the player; reuse the V1 `<video>` element by swapping `src`).
- Each tile carries an `aria-label` describing the correlation reason and evidence signal (accessibility — non-color cue requirement, [UI_UX_REQUIREMENTS.md §10](UI_UX_REQUIREMENTS.md)).

### 5.3 Related incidents queue (V6, V11)
- V6 renders a vertical list of canned related-incident cards from the manifest. Each card displays: `PENDING` badge, dispatch action label (e.g. *"Dispatch Traffic Police patrol to CAD-2026-00182"*), CAD ID, short description, assigned unit, ETA, and a `View Call →` link.
- Each card carries an **AI relevance score** (0.00–1.00) rendered as a small horizontal bar (filled portion proportional to score) plus the numeric value, with the Copilot icon. The bar's fill color ramps from neutral (low) to AI-accent (high).
- Each card includes a one-line **Why related** explanation describing the AI's reasoning (e.g. *"same block · 2 floors above · ≤ 3 min apart"*).
- Cards are sorted by relevance score descending by default. *(Future hook: a `Sort: relevance ▼` control to toggle ordering.)*
- Cards are styled to read as CAD entries; visual distinct from V4 (no thumbnail).
- **Click opens V11 side drawer** with the full incident record. Drawer:
  - Slides in from the right edge with a 200 ms transition.
  - Overlays only V7–V9 (right column); V1/V4/V6 remain interactive.
  - Has a header with CAD ID, close (`✕`) button, and `Esc` keyboard dismiss.
  - Body sections: *Summary*, *Location*, *Assigned units*, *Timeline*, *Notes*.
  - Footer actions: `Cross-reference with current alert` (no-op stub in v1, surfaced for narration) and `Open full record` (disabled, future hook for routed page).
- Empty queue shows the empty state copy in §3a.3.

### 5.4 AI Dispatch Summary (V7, V8, V9, V10)
- V7 tab strip identical to [UI_UX_REQUIREMENTS.md §3a.1](UI_UX_REQUIREMENTS.md). Active tab defaults to the value declared in the manifest's `dispatch_summary.recommended_tab`.
- V8 renders the manifest's `dispatch_summary.sections[]` as bulleted lists. The required sections are: *Location*, *Nature of emergency*, *People affected*, *Hazards*, *Recommended units*, *Operator notes*.
- V8 header shows a **trigger-metadata strip** above the section list, e.g. *"Drafted from CAD-2026-00210 · AI-triggered · P1 · 4 corroborating sources"*. Static text, ties the summary back to V0.
- The **first bullet** of *Nature of emergency* is the AI classification line, e.g. *"Likely residential fire (AI classifier confidence 0.94)"*. This bullet is editable like any other but carries an inline AI badge to mark its provenance.
- V8 carries the Copilot icon and the responsible-AI disclosure ([UI_UX_REQUIREMENTS.md §11](UI_UX_REQUIREMENTS.md)).
- V10 controls and the entire view/edit lifecycle **reuse [DEMO_REQUIREMENTS.md §4.7](DEMO_REQUIREMENTS.md) verbatim**, including:
  - View / edit modes, per-bullet inputs, add/remove/reorder.
  - Edit provenance (left border + *"edited"* caption).
  - Per-row Revert and panel-level *Revert all to AI draft*.
  - Validation (Save disabled if Location, Nature of emergency, or Recommended units is empty; empty bullets stripped on Save).
  - Audit caption *"Last edited by operator·‹timestamp›"*.
  - Keyboard reachability and `Esc` cancels edit.
- V9 `Dispatch` button is **destructive-styled**, anchored bottom-right of the right column, disabled while in edit mode, and gated by a confirmation modal that shows the **edited** Recommended units verbatim.

### 5.5 Scenario manifest schema (extension to existing `data/scenarios/*.prompt.yml`)
A video scenario lives in its **own folder** under `data/video-scenarios/<scenario-id>/`, alongside the mp4 assets. The manifest file is `manifest.yml` with the following shape (YAML):

```yaml
id: apartment-fire-commonwealth-blk84
title: "Video: Apartment fire —  Blk 84 Commonwealth Crescent"
kind: video                         # discriminator vs the existing call scenarios
is_demo: true

ai_trigger:
  cad_id: "CAD-2026-00210"
  triggered_at: "2026-04-21T16:22:48+08:00"
  classification: "Likely residential fire"
  short_location: "Blk 84 Commonwealth Crescent #08-12"
  priority: "P1"
  severity: "HIGH"
  confidence: 0.94
  status: "awaiting-validation"      # awaiting-validation | acknowledged | dispatched | dismissed
  evidence:
    - { source: "primary",   confidence: 0.91, signal: "Active fire" }
    - { source: "related-1", confidence: 0.88, signal: "Fire signature" }
    - { source: "related-2", confidence: 0.79, signal: "Smoke plume" }
    - { source: "related-3", confidence: 0.72, signal: "Evacuation activity" }

primary_feed:
  camera_id: "042895"
  location: "Blk 84 Commonwealth Crescent"
  source: "primary.mp4"             # path relative to the scenario folder
  ai_overlay:
    box: { x: 0.42, y: 0.28, w: 0.18, h: 0.22 }   # normalized [0,1]
    label: "Active fire detected"

related_feeds:                      # exactly 3 entries in v1
  - camera_id: "042901"
    location: "Blk 84 Commonwealth Crescent — Common corridor (Level 8)"
    source: "related-1.mp4"
    poster: "thumbs/related-1.jpg"
    correlation_reason: "Same level — cluttered common corridor with active fire visible at affected unit"
    evidence_signal: "Fire signature"
    evidence_confidence: 0.88
  - camera_id: "042907"
    location: "Blk 84 Commonwealth Crescent — Adjacent surface carpark"
    source: "related-2.mp4"
    poster: "thumbs/related-2.jpg"
    correlation_reason: "Adjacent surface carpark — visible smoke; potential vertical/lateral spread, fire engine access route"
    evidence_signal: "Smoke plume"
    evidence_confidence: 0.79
  - camera_id: "043120"
    location: "Blk 84 Commonwealth Crescent — Void deck"
    source: "related-3.mp4"
    poster: "thumbs/related-3.jpg"
    correlation_reason: "Block void deck — sudden surge of residents evacuating; crowd-control needed"
    evidence_signal: "Evacuation activity"
    evidence_confidence: 0.72

related_incidents:                  # sorted by relevance desc at render time
  - cad_id: "CAD-2026-00182"
    badge: "PENDING"
    priority: "P1"
    type: "FIRE"
    title: "Dispatch Fire response to CAD-2026-00182"
    description: "Loud explosion / blast heard from upper-floor HDB unit, same block — possible gas cylinder ignition"
    unit: "Fire Engine 52"
    eta_minutes: 5
    opened_at: "2026-04-21T16:23:11+08:00"
    relevance: 0.92
    relevance_reason: "same block · 2 floors above · ≤ 3 min apart"
  - cad_id: "CAD-2026-00190"
    badge: "PENDING"
    priority: "P2"
    type: "MEDICAL"
    title: "Dispatch Light Rescue + Ambulance to CAD-2026-00190"
    description: "Possible injured residents in neighbouring unit — smoke inhalation, mobility-impaired occupant reported"
    unit: "Light Rescue + Ambulance 33"
    eta_minutes: 7
    opened_at: "2026-04-21T16:25:02+08:00"
    relevance: 0.81
    relevance_reason: "adjacent unit · smoke inhalation consistent with primary fire"
  - cad_id: "CAD-2026-00178"
    badge: "PENDING"
    priority: "P3"
    type: "POLICE"
    title: "Dispatch Neighbourhood Police patrol to CAD-2026-00178"
    description: "Sudden disturbance at block void deck — residents evacuating en masse, crowd-control assistance requested"
    unit: "Neighbourhood Police patrol"
    eta_minutes: 6
    opened_at: "2026-04-21T16:18:44+08:00"
    relevance: 0.68
    relevance_reason: "same block void deck · evacuation activity matches related-3 feed"

dispatch_summary:
  recommended_tab: "FIRE"           # FIRE | POLICE | MEDICAL ASSISTANCE
  sections:
    location:
      - "Blk 84 Commonwealth Crescent, #08-12, Singapore 140084"
      - "8th floor — HDB lift lobby, unit along common corridor"
      - "Nearest landmark: Commonwealth MRT Exit B / Commonwealth Crescent Market"
    nature_of_emergency:
      - "Active kitchen grease fire spreading to overhead cabinets"
      - "Heavy smoke visible from corridor window"
      - "High Traffic activity in common areas"
    hazards:
      - "High-rise HDB — risk of vertical spread via lift shaft and corridor"
    recommended_units:
      - "Red Rhino 1 — Queenstown Fire Station (fire suppression)"
      - "Fire Engine 51 (high-rise support)"
      - "Ambulance 29 (smoke inhalation evaluation)"
    operator_notes: []
```
apartment-commonwealthcrescent
The backend ([backend/src/services/scenario_utils.py](../backend/src/services/scenario_utils.py)) must surface video scenarios alongside call scenarios without schema-validating the new fields out. Discrimination on `kind: video` is the supported way for the frontend to route to the Video Analytics workspace.

---

## 6. Demo Data Requirements

A single shipped scenario for v1:

| Scenario | Folder | Tab | Notes |
|---|---|---|---|
| Apartment fire — Blk 84 Commonwealth Crescent | `data/video-scenarios/apartment-commonwealthcrescent/` | `FIRE` | Primary mp4: apartment exterior with visible fire/smoke. Related feeds: cluttered common corridor with fire at unit, adjacent surface carpark with smoke, block void deck with people rushing about. Related incidents demonstrate fire-adjacent escalations (explosion in upper-floor unit, injured neighbour, void-deck disturbance). |

### 6.1 Asset layout
```
data/video-scenarios/
└── apartment-commonwealthcrescent/
    ├── manifest.yml
    ├── primary.mp4
    ├── related-1.mp4        # cluttered common corridor — fire visible at unit
    ├── related-2.mp4        # adjacent surface carpark — visible smoke
    ├── related-3.mp4        # block void deck — residents rushing about
    └── thumbs/
        ├── primary.jpg      # optional poster for V1
        ├── related-1.jpg
        ├── related-2.jpg
        └── related-3.jpg
```

### 6.2 Asset constraints
- **Format:** mp4 (H.264 + AAC) so they play in any modern browser without transcoding.
- **Resolution:** ≤ 1280×720, ≤ 30 s each, ≤ 5 MB each (keeps the repo lean for demo purposes).
- **Audio:** muted at the player level — no audio narration required.
- **Posters (`thumbs/*.jpg`):** ≤ 200 KB each; used for V4 tile placeholders before hover-preview kicks in.

---

## 7. Component Mapping (delta vs. existing code)

| Wireframe component | Existing | New / change |
|---|---|---|
| Scenario entry | [frontend/src/components/ScenarioList.tsx](../frontend/src/components/ScenarioList.tsx) | Add a "Video Analytics" group/badge; render video scenarios in the same list. |
| Video workspace shell | — | New `frontend/src/components/VideoFeedWorkspace.tsx` — two-column layout per §3. |
| V0 AI Trigger Banner | — | New `frontend/src/components/AiTriggerBanner.tsx` — CAD ID, triage chips, confidence, status pill, validation actions. |
| V1–V3 Primary feed | — | New `frontend/src/components/PrimaryFeedPanel.tsx` — `<video>` element + V2 banner + V3 SVG overlay. |
| V4–V5 Related feeds grid | — | New `frontend/src/components/RelatedFeedsGrid.tsx` — 3 tiles, hover-preview, click-to-promote, evidence chips, aggregate strip. |
| V6 Related incidents queue | — | New `frontend/src/components/IncidentQueuePanel.tsx` with relevance bar + Why related line. |
| V7–V10 Dispatch Summary | `DispatchSummaryPanel` (planned by [DEMO_REQUIREMENTS.md §6](DEMO_REQUIREMENTS.md)) | **Reused as-is**, fed from the video scenario's `dispatch_summary`. |
| V11 Incident detail drawer | — | New `frontend/src/components/IncidentDetailDrawer.tsx`. |
| Video demo controller | — | New `frontend/src/hooks/useVideoDemo.ts` — orchestrates step timings (§4) and exposes the active primary feed, related feeds, queue, and AI summary. |
| Editable summary state | `useEditableDispatchSummary` (planned by [DEMO_REQUIREMENTS.md §4.7](DEMO_REQUIREMENTS.md)) | **Reused as-is**. |
| Scenario loader | [backend/src/services/scenario_utils.py](../backend/src/services/scenario_utils.py) | Surface `kind: video` scenarios; pass through manifest fields without dropping unknown keys. |

---

## 8. Acceptance Criteria

1. Selecting the *Video: Apartment fire — Blk 84 Commonwealth Crescent* scenario and clicking **Start demo** transitions directly into the Video Analytics workspace with no modal blocking the primary feed (V1).
2. Within **1 s of Start**, the V0 AI Trigger Banner shows the CAD ID, `P1`, `HIGH`, classification (*Likely residential fire*), short location, detection timestamp, aggregate confidence, corroborating-source count, the three validation actions, and an `Awaiting validation` status pill.
3. Within **2 s of Start**, V1 is playing the primary mp4 (muted, looped), V2 banner shows the camera ID and location, and V3 AI highlight is visible.
4. Within **3 s of Start**, V4 shows three related-feed thumbnails with the AI corroborating-sources caption (V5), Copilot icon, an evidence-signal chip on each tile, per-source confidence, and the aggregate-confidence strip.
5. Within **3 s of Start**, V6 shows at least one related-incident card with an AI relevance score (bar + numeric value) and a *Why related* explanation; cards are sorted by relevance descending; the queue is keyboard-navigable.
6. Within **5 s of Start**, V8 has rendered the AI dispatch summary under the FIRE tab with all required sections, the trigger-metadata strip, the AI classification first bullet under *Nature of emergency*, the Copilot icon, and the responsible-AI disclosure.
7. Clicking `Acknowledge & dispatch` in V0 transitions the status pill to `Acknowledged`, moves focus to V8, and briefly highlights the V9 Dispatch button. Clicking `Dismiss as false positive` opens a confirmation modal; on confirm, the status pill flips to `Dismissed` and the workspace returns to its step-0 empty/loading states.
8. Clicking any V4 thumbnail promotes it to V1 in **≤ 300 ms** without remounting the `<video>` element; the previously primary feed swaps into the same V4 slot; V2 banner updates.
9. Clicking any V6 card opens the V11 side drawer in **≤ 250 ms**; the drawer overlays only the right column and **never** covers V1; pressing `Esc` or the `✕` button dismisses it.
10. The Dispatch Summary panel can be switched into edit mode; bullets can be added, edited, removed, and reverted; required sections cannot be saved empty; the Dispatch confirmation reflects the edited content (full §4.7 compliance from [docs/DEMO_REQUIREMENTS.md](DEMO_REQUIREMENTS.md)). On dispatch, the V0 status pill flips to `Dispatched`.
11. The `Dispatch` button (V9) is destructive-styled, disabled in edit mode, and always requires confirmation.
12. All AI-generated artifacts (V0 banner, V3 highlight, V5 caption, V6 relevance scores, V8 summary) carry the Copilot icon; the responsible-AI disclosure is visible in the right column.
13. All interactive elements (V0 actions, V4 tiles, V6 cards, V10 controls, V11 drawer, V9 button) are reachable and operable by keyboard alone, with visible focus states.
14. Full demo (steps 0–8 in §4) completes in **≤ 90 s** with default timings.

---

## 9. Future Hooks (not built in v1, but designed for)

- **Real CV inference:** replace the static V3 box with a per-frame detection feed; the manifest's `ai_overlay` becomes a timeline `[ { t_ms, box, label } ]`.
- **Real correlation engine:** replace the manifest's `related_feeds[]` and `related_incidents[]` with backend endpoints (`GET /api/feeds/{id}/related`, `GET /api/incidents/related?lat=…&lng=…&within_minutes=…`).
- **Real camera ingest:** swap the `<video>` `src` for an HLS / WebRTC stream; the rest of the layout is unchanged.
- **Routed Incident page:** the V11 drawer's *Open full record* button becomes a link to `/incidents/{cad_id}`; the drawer itself stays as a quick-look affordance.
- **Cross-link from voice-call demo:** the call-demo's Dispatch Summary gains a *"Open related camera feeds"* action that deep-links into the matching video scenario.
- **Persisted summary edits + audit log:** same hook as [DEMO_REQUIREMENTS.md §8](DEMO_REQUIREMENTS.md) — `PATCH /api/cases/{id}/dispatch-summary` records each diff against the AI draft.
- **Merge incidents:** the V11 drawer's *Cross-reference with current alert* button becomes a real merge action that links the related CAD record to the active alert.

---

## 10. Open Questions

- Should V1 expose a `Pause / Play` overlay control for live demos, or remain controls-free for a "live camera" feel?
- Should related-feed promotion (step 5) be **destructive** (the previously primary feed disappears) or **non-destructive** (swap into the V4 grid as proposed)? Current spec says swap.
- Should the V11 drawer's *Cross-reference with current alert* be a visible no-op stub in v1 (for narration) or hidden until the backend hook exists?
- Should the Video Analytics workspace and the voice-call workspace ever be visible **side by side** (e.g., split view) when an inbound call relates to an active video alert, or remain mutually exclusive entry points?
- Should the related-incidents queue (V6) auto-refresh on a fake interval to demonstrate "new pending incidents" live, or remain static after step 3?
- Should the AI dispatch summary in this video module be allowed to **flow back** into a structured Information panel (no equivalent of `C2` exists in this workspace), or stay self-contained in V8?
