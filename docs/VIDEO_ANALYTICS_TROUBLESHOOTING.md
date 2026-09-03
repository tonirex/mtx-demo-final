# Video Analytics Demo — Troubleshooting Log

Fixes applied during implementation of the Video Analytics dispatcher workspace.

---

## Bug 1: Phase machine self-cancelled — `useVideoDemo.ts`

**Symptom:** After clicking "Start demo", only the primary feed area transitions to `primary-live`. Related feeds, incident queue, and dispatch summary never appear — they stay as skeletons/empty state indefinitely.

**Root cause:** The `useEffect` that schedules the scripted timeline included `phase` in its dependency array and returned a cleanup function that cleared all timers:

```ts
// BROKEN — cleanup kills sibling timers on every phase change
useEffect(() => {
  if (phase !== 'connecting') return
  const timers: number[] = []
  timers.push(window.setTimeout(() => setPhase('primary-live'), ...))
  timers.push(window.setTimeout(() => setPhase('related-live'), ...))
  // ... more timers
  return () => timers.forEach(t => window.clearTimeout(t))  // ← kills everything
}, [phase, ...])
```

When the first timer fired and set `phase` to `'primary-live'`, React re-ran the effect. The cleanup from the *previous* render executed first, clearing all remaining scheduled timers.

**Fix:** Store timers in a `useRef` so they persist across renders. Remove the cleanup return from the effect. Instead, timers are cleared explicitly by `reset()` and on unmount:

```ts
const timersRef = useRef<number[]>([])
const clearTimers = useCallback(() => {
  timersRef.current.forEach(t => window.clearTimeout(t))
  timersRef.current = []
}, [])

useEffect(() => clearTimers, [clearTimers])  // unmount cleanup

useEffect(() => {
  if (phase !== 'connecting') return
  clearTimers()
  timersRef.current.push(window.setTimeout(() => setPhase('primary-live'), ...))
  // ... rest of timers stored in timersRef
  // NO cleanup return — timers must survive phase changes
}, [phase, ...])
```

**File:** `frontend/src/hooks/useVideoDemo.ts`

---

## Bug 2: Video `src` never set on mount — `PrimaryFeedPanel.tsx`

**Symptom:** The primary feed area shows a solid black rectangle even after the phase advances to `primary-live`. No video plays.

**Root cause:** The `<video>` element is conditionally rendered based on the `live` prop:

```tsx
{live ? <video ref={videoRef} ... /> : <Placeholder />}
```

The `useEffect` that imperatively sets `videoRef.current.src` only depended on `[feed.source, scenarioId]`:

```ts
// BROKEN — does not re-run when `live` changes
useEffect(() => {
  const v = videoRef.current  // null when live=false (no <video> in DOM)
  if (!v) return
  v.src = url
  v.load()
  v.play()
}, [feed.source, scenarioId])
```

On initial render (`live=false`), the effect ran but `videoRef.current` was `null` (no `<video>` in the DOM). When `live` became `true` and the `<video>` element mounted, the effect **did not re-run** because `feed.source` and `scenarioId` hadn't changed.

**Fix:** Add `live` to the dependency array and guard on it:

```ts
useEffect(() => {
  const v = videoRef.current
  if (!v || !live) return
  const url = getVideoAssetUrl(scenarioId, feed.source)
  v.src = url
  v.load()
  v.play().catch(() => {})
}, [feed.source, scenarioId, live])
```

**File:** `frontend/src/components/PrimaryFeedPanel.tsx`

---

## Bug 3: Griffel `borderColor` shorthand rejected — `IncidentQueuePanel.tsx`

**Symptom:** `npx tsc --noEmit` reports `Type 'string' is not assignable to type 'undefined'` on `borderColor` properties inside `makeStyles`.

**Root cause:** Fluent UI's Griffel CSS-in-JS engine disallows certain CSS shorthand and longhand properties (including `borderColor`, `borderWidth`, `borderStyle`) in `makeStyles` because they conflict with its atomic CSS output.

**Fix:** Replaced the hover/selected `borderColor` highlight with `boxShadow: inset 0 0 0 Npx <color>`, which Griffel allows:

```ts
'&:hover, &:focus-visible': {
  boxShadow: `inset 0 0 0 1px ${tokens.colorBrandStroke1}`,
},
cardSelected: {
  boxShadow: `inset 0 0 0 2px ${tokens.colorBrandStroke1}`,
},
```

**File:** `frontend/src/components/IncidentQueuePanel.tsx`

---

## Bug 4: Corrupted App.tsx after formatter — `App.tsx`

**Symptom:** `npx tsc --noEmit` reports 7 parse errors in `App.tsx` — garbled lines like `conVideo Analytics demo:` and a stray `VideoScenario) {`.

**Root cause:** A previous edit was partially mangled, likely by a formatter or merge conflict. The `handleStart` function lost its `const scenario = ...` declaration and the video-routing comment, and the render section's `if (activeVideoScenario)` block was split across garbage tokens.

**Fix:** Manually repaired both the `handleStart` function body and the render-branch block to their intended form.

**File:** `frontend/src/app/App.tsx`

---

## Change 5: Incidents panel moved to right column — `VideoFeedWorkspace.tsx`

**Request:** Move the "Possible related incidents" panel to the right side (above the dispatch summary), matching the design markup.

**Before:** Bottom-left area used a 50/50 grid split — related feeds on the left half, incidents on the right half.

**After:** Related feeds span the full bottom-left width. Right column is now a vertical stack: incidents panel (top, fixed height) → dispatch summary (bottom, flex). The `bottomLeft` grid class was removed; a new `incidentWrapper` class constrains the incidents panel to `max-height: 40%`.

**Files changed:** `frontend/src/components/VideoFeedWorkspace.tsx`

---

## Change 6: AI-generated badge on related feed tile descriptions — `RelatedFeedsGrid.tsx`

**Request:** Indicate that the correlation reason text on each related feed tile is AI-generated.

**Change:** Each tile's `correlation_reason` text is now preceded by a Copilot sparkle icon (`BotSparkleRegular`) in brand colour. Feeds without a `correlation_reason` (i.e. the original primary feed after it is swapped into the grid) display "Primary alerting feed" as a fallback label so it remains identifiable.

**Files changed:** `frontend/src/components/RelatedFeedsGrid.tsx`

---

## Change 7: Correlation reason shown in primary feed banner — `PrimaryFeedPanel.tsx`

**Request:** When a related feed is promoted to the main frame, show the AI-generated description in the banner.

**Change:** The banner now shows `feed.correlation_reason` (with a Copilot sparkle icon) alongside the existing "AI highlight" badge when the selected feed has a correlation reason. When the original primary feed is selected the correlation_reason is absent so only the "AI highlight" badge renders.

**Files changed:** `frontend/src/components/PrimaryFeedPanel.tsx`

---

## Change 8: Original primary feed selectable from related grid

**Request:** After promoting a related feed to primary there was no way to select back the original primary feed.

**How it works:** The `promote()` function in `useVideoDemo` already performs a swap — the previously primary feed lands in the related-feed slot that the promoted tile vacated. Change 6 labels it "Primary alerting feed" so the operator can recognise it. Clicking it promotes it back to V1 exactly like any other related tile — no additional code was needed.

**Files changed:** none (behaviour already present; resolved by Change 6's label)

---

## Change 9: Cross-reference toggle button — `IncidentDetailDrawer.tsx`

**Request:** Clicking "Cross-reference with current alert" should change the button colour and label to "Cross-referenced". Clicking again reverts it.

**Change:** Added a `crossReferenced` boolean state. The button toggles between:
- Default: `appearance="secondary"`, `LinkRegular` icon, label "Cross-reference with current alert"
- Active: `appearance="primary"` (blue), `CheckmarkRegular` icon, label "Cross-referenced"

The state resets to `false` whenever a new incident drawer opens (inside the `useEffect` that moves focus on open). The `Tooltip` wrapper was removed since the button is now interactive rather than a stub.

**Files changed:** `frontend/src/components/IncidentDetailDrawer.tsx`

---

## Change 10: AI description shown in primary feed banner — `PrimaryFeedPanel.tsx`

**Request:** Ensure the AI-generated description for the main video is shown, mentioning that there is an active fire detected.

**Change:**
1. Added `ai_description?: string` to the `CameraFeed` type — a longer narrative shown in the V1 banner when this feed is primary.
2. Restructured the banner from a single flex row to a 2-row stack:
   - **Top row:** camera/location info on the left, correlation-reason + AI-highlight badges on the right.
   - **Bottom row (when `ai_description` is present):** a brand-coloured-bordered callout box with a Copilot sparkle icon, "AI description:" label, and the narrative text.
3. Populated the apartment-fire scenario's `primary_feed.ai_description` with: *"Active fire detected — bright orange flames emerging from a mid-floor unit window, extending outward and rising vertically. Fire appears contained to a single apartment with no visible spread to adjacent units. No visible occupants, firefighting activity, or evacuation efforts in scene."*

**Files changed:** `frontend/src/components/PrimaryFeedPanel.tsx`, `frontend/src/types/index.ts`, `frontend/src/data/videoScenarios.ts`

---

## Change 11: Restructured dispatch summary into video-aware sections

**Request:** Split the hardcoded dispatch summary content. Carve out parts for AI video observations (visible flames, plain concise description), camera-location-derived information (block/floor), and possible AI interpretations (containment, neighbouring-unit visibility). Adapt the user-supplied AI Detection Narrative as the source.

**Change:** Extended `DispatchSummary` and `VideoDispatchSummarySections` with two new required sections:

| Field | Purpose |
|---|---|
| `video_observations: string[]` | Concise plain observations from the camera frame (visible flames, smoke, no visible occupants). |
| `interpretations: string[]` | AI-derived possible interpretations (containment, vertical/horizontal spread risk, neighbouring-unit visibility). |

**Editor hook updates** (`useEditableDispatchSummary.ts`):
- Added `'video_observations'` and `'interpretations'` to `SectionKey`.
- Renamed labels for clarity:
  - `Location` → **Location (from camera metadata)**
  - `Hazards` → **Hazards & risk assessment**
  - new: **AI video observations**, **Possible AI interpretations**
- `saveEdit` now strips empty bullets from the two new sections.
- Required sections (for Save validation) unchanged: `location`, `nature`, `units`.

**Mapper update** (`VideoFeedWorkspace.tsx → toDispatchSummary`):
- Copies `sections.video_observations` and `sections.interpretations` from the manifest into the flat `DispatchSummary` shape consumed by `DispatchSummaryPanel`.

**Manifest content rewrite** (`videoScenarios.ts`):
- **Location** now lists the building, camera identifier, estimated floor/unit, and nearest landmark (camera-derived metadata).
- **Nature of emergency** is now 2 short summary lines, not a 3-line mix of observations and interpretations.
- **Video observations** lists the 5 plain visual facts from the camera frame.
- **People affected** describes only what is *visible* on camera (no occupants in affected unit, none at neighbouring windows).
- **Possible AI interpretations** lists 4 likely scenarios (containment, spread risks, occupant visibility caveats).
- **Hazards & risk assessment** lists structural and environmental risk factors.
- **Recommended units** unchanged but expanded to 4 units.

**Backwards compatibility** (`demoScenarios.ts`):
- The 3 existing call demos (fire, accident, crime) now include `video_observations: []` and `interpretations: []` so the typecheck stays clean and the panel still renders these sections (empty) for non-video demos. This is acceptable since the editable panel allows the operator to add bullets to any section.

**Files changed:**
- `frontend/src/types/index.ts`
- `frontend/src/hooks/useEditableDispatchSummary.ts`
- `frontend/src/components/VideoFeedWorkspace.tsx`
- `frontend/src/data/videoScenarios.ts`
- `frontend/src/data/demoScenarios.ts`
