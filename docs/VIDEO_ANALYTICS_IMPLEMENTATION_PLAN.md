# Implementation Plan — Video Analytics Dispatcher Workspace

**Document version:** 1.0
**Status:** Planning
**Owner:** Frontend / Demo
**Spec:** [docs/VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md)
**Companion docs:** [docs/UI_UX_REQUIREMENTS.md](UI_UX_REQUIREMENTS.md), [docs/DEMO_REQUIREMENTS.md](DEMO_REQUIREMENTS.md)

---

## 0. Pre-flight: Spec validation & asset inventory

### 0.1 Validation pass against [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md)
| Spec section | Status | Notes |
|---|---|---|
| §3 Layout (two-column, left split) | ✅ Implementable | Use CSS grid in a new `VideoFeedWorkspace.tsx`. |
| §3a Component map V1–V11 | ✅ | Maps cleanly to the components listed in §7. |
| §4 Demo flow (steps 0–8) | ✅ | All timings drivable from a single `useVideoDemo` hook. |
| §5.1 Primary feed + AI overlay | ✅ | `<video>` + absolutely-positioned SVG overlay; coords from manifest. |
| §5.2 Related feeds promote-to-primary in ≤ 300 ms | ⚠️ | Achievable only if we **swap `src` on a single `<video>` element** rather than remount; locked into the architecture below (Phase 2). |
| §5.3 Side drawer never covers V1 | ✅ | Drawer is positioned over the right column only (CSS, not a portal at `body`). |
| §5.4 + §4.7 Editable Dispatch Summary | ✅ | Reuse existing [`DispatchSummaryPanel`](../frontend/src/components/DispatchSummaryPanel.tsx) and [`useEditableDispatchSummary`](../frontend/src/hooks/useEditableDispatchSummary.ts). |
| §5.5 Manifest schema (`kind: video`) | ⚠️ | Backend [`scenario_utils.py`](../backend/src/services/scenario_utils.py) currently scans only `data/scenarios/`. Needs a sibling loader for `data/video-scenarios/` (Phase 1). |
| §6 Single shipped scenario | ✅ | `data/video-scenarios/apartment-commonwealthcrescent/` is created and populated (see §0.2). |
| §8 Acceptance criteria | ✅ | All criteria are testable; Phase 6 is the verification phase. |
| Open questions §10 | ⚠️ | Pre-empt with defaults during Phase 0 (see §0.3). |

**Spec gaps caught during validation:**

1. ~~The spec's §5.5 example used `Blk 84 Commonwealth Crescent` for the AI summary while the §6 table referenced *"Tampines Blk 123"*.~~ **Resolved.** All Tampines references removed from the spec; §6 table now reads *"Apartment fire — Blk 84 Commonwealth Crescent"*. The spec also corrects the related-feed descriptions to match the actual mp4 content (common corridor with fire / adjacent carpark with smoke / void deck with rushing residents) and replaces the related-incidents queue with **fire-adjacent** escalations (upper-floor explosion, injured neighbour, void-deck disturbance) instead of unrelated traffic/animal cases.
2. The §5.5 manifest dropped the *People affected* and *Operator notes* sections from `dispatch_summary.sections`, but §5.4 still requires those sections to render. **Action:** either re-add to the manifest with empty arrays (preferred) or have the panel tolerate missing keys. Preferred fix: re-add with the canned content from the user's mockup.
3. The §5.5 manifest example contains an **orphan token** `apartment-commonwealthcrescent` immediately after the closing code fence. **Action:** strip in Phase 0.
4. The spec promises optional `thumbs/*.jpg` posters for V4 tiles, but no thumbs were shipped. **Action:** Phase 2 will fall back to a **paused first-frame** of each related mp4 instead of a poster image.
5. Acceptance criterion §8.1 references the title *"Apartment fire — Blk 84 Commonwealth Crescent"* but the manifest `id` is `apartment-fire-commonwealth-blk84` and the folder is `apartment-commonwealthcrescent`. We will keep the user-visible title, the folder name `apartment-commonwealthcrescent`, and align the manifest `id` to the folder for predictability.

### 0.2 Asset inventory (post-fix)

The user supplied 4 mp4 clips. They were moved into the scenario folder and the `.mp4.mp4` double-extension typo was corrected:

```
data/video-scenarios/
└── apartment-commonwealthcrescent/
    ├── primary.mp4       3.5 MB   apartment-on-fire (alerting feed, Camera 042895)
    ├── related-1.mp4     4.2 MB   cluttered common corridor — fire visible at unit
    ├── related-2.mp4     3.3 MB   adjacent surface carpark — visible smoke
    └── related-3.mp4     4.1 MB   block void deck — residents rushing about
```

Missing (optional per §6.1):
- `manifest.yml` — to be authored in Phase 1.
- `thumbs/*.jpg` posters — Phase 2 will derive a poster from each mp4's first frame at runtime instead.

All four files are well under the 5 MB / 30 s / 720p budget in [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §6.2](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md).

### 0.3 Default answers to open questions (§10)
To keep the build moving, ship with these defaults; revisit before final demo:

| Open question | Default for v1 |
|---|---|
| V1 `Pause / Play` overlay | **Yes** — minimal play/pause icon, fades on hover. |
| Promote-to-primary destructive vs. swap | **Swap.** Previously primary feed lands in the same V4 slot. |
| Drawer's *Cross-reference with current alert* | **Visible no-op stub** with a tooltip *"Demo only — backend hook in roadmap"*. |
| Side-by-side video + voice workspace | **Mutually exclusive.** Single workspace at a time in v1. |
| V6 auto-refresh | **Static** after step 3. |
| Summary flow-back into Information panel | **Self-contained in V8.** No flow-back. |

---

## 1. Phased rollout

Each phase ships a runnable, demo-able slice. The phases are sized so that an interruption between any two phases still yields a presentable state.

### Phase 1 — Manifest + scenario loader (backend + types)
**Outcome:** The `apartment-commonwealthcrescent` scenario is discovered by the backend, exposed via the existing `/api/scenarios` response (with `kind: "video"`), and typed in the frontend.

**Tasks**
1. Author `data/video-scenarios/apartment-commonwealthcrescent/manifest.yml` per [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §5.5](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md), with the §0.1 fixes applied (re-add `people_affected` + `operator_notes`, align `id`, drop the orphan token).
2. Extend [`backend/src/services/scenario_utils.py`](../backend/src/services/scenario_utils.py) and [`backend/src/services/managers.py`](../backend/src/services/managers.py) (`ScenarioManager`) to scan `data/video-scenarios/*/manifest.yml` in addition to the existing `data/scenarios/*.prompt.yml`.
3. Surface the new fields **untouched** through `/api/scenarios` (no schema-validating them out). The response item gains `kind: "call" | "video"` (default `"call"` for back-compat).
4. Frontend types: extend [`frontend/src/types/index.ts`](../frontend/src/types/index.ts) with `VideoScenario`, `PrimaryFeed`, `RelatedFeed`, `RelatedIncident`, `AiOverlayBox`, `DispatchSummary` (or reuse if the call-demo work has already added it).
5. Add a tiny static-file route (or rely on `flask.send_from_directory`) so `data/video-scenarios/<id>/<file>.mp4` is fetchable from the browser. Path: `GET /api/video-scenarios/<id>/<file>` returning the mp4 with correct `Content-Type: video/mp4` and `Accept-Ranges: bytes`.

**Acceptance**
- `curl /api/scenarios` returns the new video scenario with full manifest fields.
- `curl -I /api/video-scenarios/apartment-commonwealthcrescent/primary.mp4` returns `200` and `video/mp4`.
- Frontend `useScenarios` hook receives a typed `VideoScenario`.

**Files**
- New: [data/video-scenarios/apartment-commonwealthcrescent/manifest.yml](../data/video-scenarios/apartment-commonwealthcrescent/manifest.yml)
- Edit: [backend/src/services/scenario_utils.py](../backend/src/services/scenario_utils.py)
- Edit: [backend/src/services/managers.py](../backend/src/services/managers.py)
- Edit: [backend/src/app.py](../backend/src/app.py) (new route)
- Edit: [frontend/src/types/index.ts](../frontend/src/types/index.ts)

---

### Phase 2 — Primary feed + related-feeds grid (V1–V5)
**Outcome:** Operator can view the primary feed with the AI highlight box, see three related thumbnails, and click one to promote it to primary in ≤ 300 ms.

**Tasks**
1. Build [`frontend/src/components/PrimaryFeedPanel.tsx`](../frontend/src/components/PrimaryFeedPanel.tsx) with:
   - A single `<video muted loop playsInline autoPlay>` element whose `src` is **stateful** (key off the camera, not the index).
   - V2 banner above the video.
   - V3 SVG overlay positioned via the manifest's normalized `box`.
   - Copilot icon at top-right of the video frame.
   - Optional `Pause / Play` overlay (per §0.3 default).
2. Build [`frontend/src/components/RelatedFeedsGrid.tsx`](../frontend/src/components/RelatedFeedsGrid.tsx):
   - Three tiles in a horizontal row (1×3).
   - Tile poster = first frame of the mp4 captured via a hidden `<video>` + canvas (since posters were not shipped).
   - Hover preview: muted autoplay on `mouseenter`.
   - Click → emits `onPromote(cameraId)`; the V1 player swaps `src` rather than remounts.
   - Each tile gets `aria-label` = correlation reason.
3. Lift the "currently primary" + "currently related" state into [`frontend/src/hooks/useVideoDemo.ts`](../frontend/src/hooks/useVideoDemo.ts) so promotion is a single state transition.

**Acceptance**
- All four feeds play locally in Chrome and Edge.
- Clicking a related tile promotes within 300 ms (measured via React Profiler / `performance.now()`).
- The `<video>` element is reused across promotions (verify by attaching a unique `data-instance-id` and watching it persist).

**Files**
- New: [frontend/src/components/PrimaryFeedPanel.tsx](../frontend/src/components/PrimaryFeedPanel.tsx)
- New: [frontend/src/components/RelatedFeedsGrid.tsx](../frontend/src/components/RelatedFeedsGrid.tsx)
- New: [frontend/src/hooks/useVideoDemo.ts](../frontend/src/hooks/useVideoDemo.ts)

---

### Phase 3 — Workspace shell + scenario entry (layout + routing)
**Outcome:** Selecting the new scenario in [`ScenarioList`](../frontend/src/components/ScenarioList.tsx) renders the full two-column workspace shell. Right column shows a placeholder for the dispatch summary (Phase 4 fills it in).

**Tasks**
1. Build [`frontend/src/components/VideoFeedWorkspace.tsx`](../frontend/src/components/VideoFeedWorkspace.tsx) — CSS-grid two-column shell per [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §3.1](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md), with the left column vertically split.
2. Update [`frontend/src/app/App.tsx`](../frontend/src/app/App.tsx): when the active scenario `kind === "video"`, render `VideoFeedWorkspace`; otherwise keep existing call-demo layout.
3. Update [`frontend/src/components/ScenarioList.tsx`](../frontend/src/components/ScenarioList.tsx) to badge video scenarios (e.g. a small `Video` chip on the card).
4. Wire the `Start demo` button to enter the video workspace; respect step 0 of the demo flow (skeletons everywhere first).

**Acceptance**
- Picking the apartment-fire scenario lands directly in the video workspace.
- All four zones (V1, V4, V6, V7–V9) render with their empty/loading states from §3a.3.
- No regression in the existing call-demo path.

**Files**
- New: [frontend/src/components/VideoFeedWorkspace.tsx](../frontend/src/components/VideoFeedWorkspace.tsx)
- Edit: [frontend/src/app/App.tsx](../frontend/src/app/App.tsx)
- Edit: [frontend/src/components/ScenarioList.tsx](../frontend/src/components/ScenarioList.tsx)

---

### Phase 4 — AI Dispatch Summary integration (V7–V10)
**Outcome:** The right column renders the editable dispatch summary populated from the manifest. View/edit/save/revert/dispatch all work end-to-end.

**Tasks**
1. Confirm [`DispatchSummaryPanel`](../frontend/src/components/DispatchSummaryPanel.tsx) and [`useEditableDispatchSummary`](../frontend/src/hooks/useEditableDispatchSummary.ts) are present (built by the call-demo in [DEMO_REQUIREMENTS.md §4.7](DEMO_REQUIREMENTS.md)). If not yet built, this phase blocks on that work.
2. Feed `DispatchSummaryPanel` from the manifest's `dispatch_summary` instead of the call-demo's analyzer output.
3. Implement the synthetic `AI generating…` delay (§4 step 4) inside `useVideoDemo`.
4. Wire the V9 `Dispatch` confirmation modal so it lists the **edited** `recommended_units` verbatim.

**Acceptance**
- All §4.7 sub-criteria from [DEMO_REQUIREMENTS.md](DEMO_REQUIREMENTS.md) pass for this scenario.
- Acceptance criteria 5, 8, 9 from [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §8](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md) are met.

**Files**
- Edit: [frontend/src/components/VideoFeedWorkspace.tsx](../frontend/src/components/VideoFeedWorkspace.tsx) (mount the panel)
- Possibly edit: [frontend/src/components/DispatchSummaryPanel.tsx](../frontend/src/components/DispatchSummaryPanel.tsx) (accept a "source = manifest" prop)

---

### Phase 5 — Related-incidents queue + side drawer (V6, V11)
**Outcome:** Operator can browse the canned related incidents and open a side drawer for any one of them, without losing sight of the primary feed.

**Tasks**
1. Build [`frontend/src/components/IncidentQueuePanel.tsx`](../frontend/src/components/IncidentQueuePanel.tsx) per [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §5.3](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md). Cards rendered from `manifest.related_incidents`.
2. Build [`frontend/src/components/IncidentDetailDrawer.tsx`](../frontend/src/components/IncidentDetailDrawer.tsx). Implementation must:
   - Be positioned over the right column only (CSS `position: absolute` inside the workspace's right cell, **not** a body-level portal).
   - Open with a 200 ms slide-in transition.
   - Trap focus while open; `Esc` and `✕` dismiss.
3. Hold drawer open/closed state in `useVideoDemo`.

**Acceptance**
- Drawer opens in ≤ 250 ms and never covers the V1 frame.
- Keyboard-only operation works end-to-end (Tab to a card → Enter → Esc).
- Acceptance criteria 4, 7, 11 from [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §8](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md) are met.

**Files**
- New: [frontend/src/components/IncidentQueuePanel.tsx](../frontend/src/components/IncidentQueuePanel.tsx)
- New: [frontend/src/components/IncidentDetailDrawer.tsx](../frontend/src/components/IncidentDetailDrawer.tsx)
- Edit: [frontend/src/hooks/useVideoDemo.ts](../frontend/src/hooks/useVideoDemo.ts)

---

### Phase 6 — Polish + acceptance + docs
**Outcome:** Demo passes every criterion in [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §8](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md) and is rehearsable end-to-end in ≤ 90 s.

**Tasks**
1. Tune the step timings in `useVideoDemo` against a live rehearsal.
2. Verify Copilot icon + responsible-AI disclosure on V3, V5, V8.
3. Keyboard accessibility audit (focus order, focus rings, drawer focus trap).
4. Cross-browser smoke (Chrome, Edge, Safari for video codec sanity).
5. Update [README.md](../README.md) with a one-paragraph "Run the video analytics demo" section.
6. Optional: write a unit test for the manifest loader + a Playwright smoke covering steps 1, 5, 6, 8 of the demo flow.

**Acceptance**
- All 12 criteria in [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §8](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md) pass.
- A timed dry-run completes in ≤ 90 s with default timings.

---

## 2. Risks & mitigations

| Risk | Phase | Mitigation |
|---|---|---|
| 300 ms promote-to-primary not achievable if the player is remounted | Phase 2 | Lock the `<video>` ref into a single instance; mutate `src` imperatively. |
| Side-drawer accidentally portals to `body` and covers V1 | Phase 5 | Position drawer with CSS inside the right grid cell; do **not** use Fluent UI's `Drawer` overlay default if it portals (audit during build). |
| Browser blocks autoplay due to no user gesture | Phase 2 | The `Start demo` button is the user gesture; videos must be `muted` to satisfy autoplay policy. |
| AI overlay box drifts when the video resizes | Phase 2 | Render the SVG overlay at the same coordinate space as the `<video>` (`viewBox="0 0 1 1"` + `preserveAspectRatio`). |
| Dispatch summary panel not yet built by call-demo workstream | Phase 4 | Detect during Phase 1; if missing, fold a thin port into Phase 4 scope. |
| Missing thumbnail posters cause flicker on first paint | Phase 2 | Capture first frame to a canvas + cache as a data URL on mount. |

---

## 3. Out of scope (deferred to future hooks per [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §9](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md))

- Real CV inference and timeline-driven overlay boxes.
- Real correlation engine (`/api/feeds/{id}/related`, `/api/incidents/related?…`).
- Real RTSP / WebRTC ingest.
- Routed `/incidents/{cad_id}` page.
- Cross-link from the voice-call demo.
- Server-persisted dispatch-summary edits + audit log.
- Drawer's *Cross-reference with current alert* as a real action.
