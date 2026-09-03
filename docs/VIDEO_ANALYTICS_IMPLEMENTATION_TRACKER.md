# Video Analytics Demo — Implementation Tracker

> Companion to [VIDEO_ANALYTICS_IMPLEMENTATION_PLAN.md](VIDEO_ANALYTICS_IMPLEMENTATION_PLAN.md).
> Tick boxes as each phase is validated. Source-of-truth for "what's left."

**Last updated:** 2026-04-22

---

## Phase 1 — Manifest + scenario loader (backend + types)

- [x] `data/video-scenarios/apartment-commonwealthcrescent/manifest.yml` authored with §0.1 fixes
- [x] All 4 mp4 assets placed (primary + related-1/2/3, ≤ 5 MB each)
- [x] Frontend types extended in [frontend/src/types/index.ts](../frontend/src/types/index.ts) (`VideoScenario`, `CameraFeed`, `RelatedIncident`, `AiOverlay`, `VideoDispatchSummary`)
- [x] Asset serving route added to [backend/src/app.py](../backend/src/app.py): `/video-assets/<scenario>/<file>`
- [x] Vite plugin in [frontend/vite.config.ts](../frontend/vite.config.ts) serves `/video-assets/*` in dev
- [x] Frontend fixture loader [frontend/src/data/videoScenarios.ts](../frontend/src/data/videoScenarios.ts) (chosen over backend YAML loader to keep parity with `demoScenarios.ts`)
- [x] `useScenarios` projects `VIDEO_SCENARIOS` into the scenario-card list with `kind: 'video'`
- [ ] **User validation:** Phase 1 tested ✅ ❌

### How to test Phase 1

1. Start the dev server: `cd frontend; npm run dev`
2. Open `http://localhost:5173` (or whatever Vite prints).
3. In the scenario picker dialog, confirm a card titled **"Apartment fire — Blk 84 Commonwealth Crescent"** appears with a small **Video** badge next to the name.
4. In a second terminal hit the asset route directly:
   ```powershell
   curl.exe -I http://localhost:5173/video-assets/apartment-commonwealthcrescent/primary.mp4
   ```
   Expect `HTTP/1.1 200 OK` and `Content-Type: video/mp4`.
5. Repeat for `related-1.mp4`, `related-2.mp4`, `related-3.mp4`.

---

## Phase 2 — Primary feed + related-feeds grid (V1–V5)

- [x] [PrimaryFeedPanel.tsx](../frontend/src/components/PrimaryFeedPanel.tsx) renders `<video>` + V2 banner + V3 SVG overlay + Copilot icon
- [x] Pause/Play toggle button (per §0.3 default)
- [x] [RelatedFeedsGrid.tsx](../frontend/src/components/RelatedFeedsGrid.tsx) — 3 tiles, hover-preview, click-to-promote
- [x] [useVideoDemo.ts](../frontend/src/hooks/useVideoDemo.ts) holds `primary` / `related` state and runs the phase machine
- [x] Promote-to-primary swaps `<video>` `src` imperatively via `useRef` (no remount)
- [ ] **User validation:** Phase 2 tested ✅ ❌

### How to test Phase 2

1. With the dev server still running, click the apartment-fire card → click **Start demo**.
2. Within ~1 s, the primary feed (V1) plays the corridor-fire clip. An orange box (V3) is overlaid on the burning unit.
3. After ~2 s the three related tiles (V4) appear at the bottom-left.
4. Hover one tile — it auto-plays muted; move the cursor away — it resets.
5. Click a related tile. The primary feed should switch to that camera **without a visible re-mount flicker**. The previously-primary feed lands in the same V4 slot.
6. Click the small **⏸/▶** button overlaid bottom-right of V1; the primary video should toggle.

---

## Phase 3 — Workspace shell + scenario entry (layout + routing)

- [x] [VideoFeedWorkspace.tsx](../frontend/src/components/VideoFeedWorkspace.tsx) — 65/35 grid, left column split 55/45
- [x] App.tsx renders `VideoFeedWorkspace` when `scenario.kind === 'video'`
- [x] [ScenarioList.tsx](../frontend/src/components/ScenarioList.tsx) shows a **Video** badge on video cards
- [x] Start overlay (step 0 of demo flow) blocks the workspace until the user clicks Start
- [x] Reset button top-right re-enters step 0
- [ ] **User validation:** Phase 3 tested ✅ ❌

### How to test Phase 3

1. Resize the browser to ~1280×800. The four zones (V1, V4, V6, right-column V7–V11) should all fit without horizontal scroll.
2. Resize narrower than 1100 px wide — the right column should stack underneath the left column.
3. Click **Reset demo** (top-right). The Start overlay re-appears; primary feed disappears.
4. Pick a non-video scenario (e.g. an existing call demo) — the previous `DispatcherWorkspace` flow should still render unchanged.

---

## Phase 4 — AI Dispatch Summary integration (V7–V10)

- [x] DispatchSummaryPanel mounted in the right column
- [x] `toDispatchSummary()` mapper bridges `VideoDispatchSummary` → existing `DispatchSummary`
- [x] Synthetic `AI generating…` delay driven by `useVideoDemo` (`summaryStartMs` + `summaryGenerateMs`)
- [x] V9 dispatch confirmation Dialog lists the (edited) `recommended_units`
- [x] Success toast "Dispatched (demo)" on confirm
- [ ] **User validation:** Phase 4 tested ✅ ❌

### How to test Phase 4

1. After Start, wait ~3 s — the right column shows the AI generating spinner, then the populated summary.
2. Click **Edit** in the summary panel. Change a value (e.g. add a unit). Click **Save**.
3. Click **Dispatch**. A modal lists the units exactly as edited. Click **Confirm dispatch**.
4. A green toast "Dispatched (demo)" appears bottom-right; the Dispatch button enters its dispatched state.
5. Click **Reset demo**, repeat — the dispatched state should clear.

---

## Phase 5 — Related-incidents queue + side drawer (V6, V11)

- [x] [IncidentQueuePanel.tsx](../frontend/src/components/IncidentQueuePanel.tsx) cards render from `manifest.related_incidents`
- [x] Priority colour map P1=danger, P2=warning, P3=informative
- [x] [IncidentDetailDrawer.tsx](../frontend/src/components/IncidentDetailDrawer.tsx) — `position: absolute` inside the right column (no body portal)
- [x] 200 ms slide-in transition; Esc + ✕ dismiss
- [x] Open/closed state held in `useVideoDemo`
- [ ] **User validation:** Phase 5 tested ✅ ❌

### How to test Phase 5

1. After Start + ~2.5 s, the bottom-right "Related incidents" panel (V6) populates with 3 cards (P1 explosion, P2 medical, P3 disturbance).
2. Click the first card. A drawer slides in from the right, **only over the right column** — the primary feed (V1) must remain fully visible.
3. Press **Esc**. Drawer closes with the same 200 ms slide-out.
4. Tab into a card → press **Enter**. Drawer opens. Tab through the drawer's buttons. Tab should stay inside the drawer until you press Esc.
5. Hover the **Cross-reference with current alert** button — tooltip "Demo only — backend hook in roadmap" appears. Hover **Open full record** — tooltip about future routed page; button stays disabled.

---

## Phase 6 — Polish + acceptance + docs

- [ ] Tune step timings in `useVideoDemo` against a live rehearsal (target ≤ 90 s end-to-end)
- [ ] Verify Copilot icon + responsible-AI disclosure on V3, V5, V8
- [ ] Keyboard accessibility audit (focus order, focus rings, drawer focus trap)
- [ ] Cross-browser smoke (Chrome, Edge)
- [ ] Add "Run the video analytics demo" paragraph to [README.md](../README.md)
- [ ] (Optional) Playwright smoke covering steps 1, 5, 6, 8 of the demo flow
- [ ] **User validation:** Phase 6 tested ✅ ❌

### How to test Phase 6

(Filled in when phase begins.)

---

## Acceptance criteria (from spec §8)

Validated end-to-end after Phase 6:

- [ ] AC1 — Picking the scenario lands directly in V1–V11 within ≤ 1 s
- [ ] AC2 — V1 plays the alerting feed with overlay box and Copilot disclosure
- [ ] AC3 — Three related tiles appear within ~2 s with correlation reasons
- [ ] AC4 — Promote-to-primary swap completes in ≤ 300 ms with no remount flicker
- [ ] AC5 — Dispatch summary populates after the synthetic AI delay
- [ ] AC6 — Edit / Save / Revert all behave per [DEMO_REQUIREMENTS.md §4.7](DEMO_REQUIREMENTS.md)
- [ ] AC7 — Side drawer never overlays V1
- [ ] AC8 — Dispatch modal lists edited recommended units verbatim
- [ ] AC9 — Success toast on confirm; dispatched state persists until reset
- [ ] AC10 — Keyboard-only operation works for the full flow
- [ ] AC11 — Esc closes the drawer; focus returns to the launching card
- [ ] AC12 — Full rehearsal completes in ≤ 90 s
