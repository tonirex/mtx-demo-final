# Video Analytics Dispatcher — 90-Second Demo Script

**Document version:** 1.0
**Status:** Ready for rehearsal
**Companion docs:** [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md)
**Audience:** Mixed — operations leaders, IT decision-makers, partners
**Total runtime:** ≤ 90 seconds (excluding setup and Q&A)

---

## Setup (do *before* the timer starts)

- App open at the scenario picker
- Card highlighted: **"Video: Apartment fire — Blk 84 Commonwealth Crescent"**
- Browser zoomed so V0 banner, V1 feed, V4 grid, V6 queue, and V8 summary are all visible without scrolling
- Sound off (every video plays muted)

---

## The narrative arc

> *"Today, when a CCTV system spots something, a dispatcher still has to find it, judge it, and assemble the dispatch packet from scratch. We're going to show what changes when AI does the watching, the cross-referencing, and the first-draft writing — and the dispatcher stays firmly in control."*

The demo answers three questions in order:

1. **What did the AI see?** → V0 trigger banner + V1 primary feed
2. **How sure is it, and why?** → V4 corroborating evidence + V6 related incidents
3. **What does the dispatcher do next?** → V8 editable summary + validation actions

---

## Scene-by-scene script

### Scene 1 — The trigger appears (0:00 → 0:10)

**Action:** Click the scenario card → click **Start demo**.

**On screen:** Workspace renders. Within ~½ second the **AI Trigger Banner (V0)** snaps in at the top:

> 🤖 **AI INCIDENT TRIGGER · CAD-2026-00210**  `P1`  `HIGH SEVERITY`
> Likely residential fire — Blk 84 Commonwealth Crescent #08-12
> Detected 16:22:48 · Confidence **0.94** · **4 corroborating sources**
> `Awaiting validation`

**Say:**
> *"No phone call came in. The video analytics agent detected something on its own, opened a CAD record, classified it as a likely residential fire, triaged it as P1 / HIGH severity, and is now asking the operator to validate. Notice the banner doesn't dispatch anything yet — the AI raises, the human decides."*

**Key feature highlighted:** AI-initiated incident with explicit human-in-the-loop validation.

---

### Scene 2 — The primary feed comes online (0:10 → 0:20)

**Action:** Wait ~1 s — the primary feed (V1) starts playing automatically.

**On screen:** V1 plays the apartment-fire footage. A red **AI highlight rectangle (V3)** sits over the affected window. The feed-selected banner (V2) shows:

> Selected feed: location Blk 84 Commonwealth Crescent · Camera No: 042895

**Say:**
> *"The primary feed is the camera the AI is most confident about. The red box is the AI's own bounding box around what it classified as 'Active fire detected' — same model that raised the trigger, surfaced visually so the operator can verify in one glance."*

**Key feature highlighted:** Visual evidence right alongside the AI's claim — explainability built into the UI.

---

### Scene 3 — Corroborating evidence arrives (0:20 → 0:35)

**Action:** Wait ~1 s — the **Related-Feeds Grid (V4 + V5)** populates with three thumbnails.

**On screen, above the grid:**
> 🤖 *Corroborating sources · AI cross-referenced these feeds to raise trigger confidence to **0.94***
> *Each source independently shows fire/smoke or evacuation activity consistent with the primary alert.*
>
> Primary **0.91** + Corridor **0.88** + Carpark **0.79** + Void deck **0.72** → Aggregate **0.94**

**On each tile:** evidence-signal badge (`+ Fire signature`, `+ Smoke plume`, `+ Evacuation activity`) with per-source confidence.

**Say:**
> *"This is where AI earns its keep. The system didn't just pick one camera — it scanned nearby feeds, found three that independently support the same conclusion, and shows you exactly how each one contributes to the headline confidence number. A corridor camera sees fire signature at 0.88, the carpark sees smoke at 0.79, the void deck sees mass evacuation at 0.72. Four independent signals, one aggregate of 0.94 — and you can promote any of those feeds into the primary slot with a single click if you want a closer look."*

**Optional live action:** click one related tile → it swaps into V1 in under 300 ms; previous primary takes its place. Then promote it back.

**Key feature highlighted:** Multi-source AI corroboration with transparent, per-source confidence — addresses *"can I trust this trigger?"* without making the operator hunt.

---

### Scene 4 — Related incidents queue (0:35 → 0:50)

**Action:** Point at the **Related-Incidents Queue (V6)** in the right column.

**On screen (sorted by AI relevance, descending):**

| | Incident | AI relevance | Why related |
|---|---|---|---|
| 1 | CAD-2026-00182 — Fire response (P1) | ▰▰▰▰▰▰▰▰▰▱ **0.92** | same block · 2 floors above · ≤ 3 min apart |
| 2 | CAD-2026-00190 — Light Rescue + Ambulance (P2) | ▰▰▰▰▰▰▰▰▱▱ **0.81** | adjacent unit · smoke inhalation consistent with primary fire |
| 3 | CAD-2026-00178 — Neighbourhood Police (P3) | ▰▰▰▰▰▰▱▱▱▱ **0.68** | same block void deck · evacuation activity matches related-3 feed |

**Say:**
> *"While the operator is still reading the trigger, the AI has already pulled three pending CAD records that look related — an explosion two floors up, a smoke-inhalation call from a neighbour, and a void-deck disturbance that matches what camera-3 is showing. Each card carries a relevance score with a one-line reason: same block, ≤ 3 min apart, signal matches camera-3. That last bit matters — the AI is not just saying 'related,' it's telling you why."*

**Optional live action:** click the top card → V11 side drawer slides in over the right column with the full incident record. Press `Esc` to dismiss. *Stress that the drawer never covers the live feed.*

**Key feature highlighted:** Automated cross-incident correlation with explainable scoring — turns the dispatcher's mental "is this connected to anything else?" into a visible, ranked list.

---

### Scene 5 — The dispatch summary drafts itself (0:50 → 1:10)

**Action:** Watch V8 fill in. The `AI generating…` chip resolves into a populated summary.

**On screen, top of summary:**
> *Drafted from CAD-2026-00210 · AI-triggered · P1 · 4 corroborating sources*

**Under "Nature of emergency", first bullet:**
> *Likely residential fire (AI classifier confidence 0.94)*

**Plus:** Location, video observations, people affected, AI interpretations, hazards, recommended units — all pre-populated.

**Say:**
> *"Here's the dispatch packet — written by the AI from everything it just observed. Plain-language video observations, possible interpretations, recommended units down to specific assets like Red Rhino 1 from Queenstown Fire Station. Notice the metadata strip ties it back to the original AI trigger, so anyone reading this later knows exactly which evidence underpins the recommendation."*

**Key feature highlighted:** AI-drafted dispatch packet with clear provenance back to the trigger and evidence.

---

### Scene 6 — Operator stays in control (1:10 → 1:25)

**Action:** Click **Edit** in V8. Add an operator note (e.g. *"Confirm gas cylinder ignition with Fire Engine 52 on arrival"*). Click **Save**.

**Say (while editing):**
> *"And this is the part nobody can skip — the operator owns the final word. Edit any bullet, add notes, remove anything you don't agree with. Edits are tracked with provenance and can be reverted to the AI draft. Required sections can't be saved empty. The Dispatch button is destructive-styled and gated by a confirmation that shows the **edited** units, not the AI's first draft."*

**Key feature highlighted:** Editable AI output, edit provenance, confirmation gating — responsible-AI controls baked into the workflow, not bolted on.

---

### Scene 7 — Validate and dispatch (1:25 → 1:30)

**Action:** Click **`Acknowledge & dispatch`** in V0. Status pill flips to `Acknowledged`. The view scrolls to V8 and the Dispatch button briefly halos. Click V9 **Dispatch** → confirm → status pill flips to `Dispatched`.

**Say:**
> *"Acknowledge, confirm, dispatch. The trigger banner now shows `Dispatched` so anyone who joins this incident later can see at a glance that a human reviewed it and acted. And if the operator had judged it a false positive, one click on `Dismiss as false positive` would have cleared the workspace and recorded that decision too."*

**Key feature highlighted:** End-to-end auditable validation — every state of the trigger (`Awaiting validation` → `Acknowledged` → `Dispatched`, or `Dismissed`) is visible and traceable.

---

## What this showcases (the takeaway slide in plain English)

| Operator question | Where in the workspace | What AI did |
|---|---|---|
| *"What's happening?"* | V0 trigger banner + V1 primary feed | Detected the incident from CCTV, classified it, and opened a CAD record without a phone call |
| *"How sure are we?"* | V4 evidence chips + aggregate strip | Cross-referenced three additional cameras and showed the per-source confidence breakdown |
| *"Is this connected to anything?"* | V6 related-incidents queue with relevance bars | Ranked nearby pending CAD records by AI relevance with one-line reasons |
| *"What should I dispatch?"* | V8 AI-drafted summary | Drafted the full dispatch packet — location, hazards, units — tied back to the trigger |
| *"Am I still in charge?"* | V0 validation actions + V8 edit mode + V9 destructive confirm | Every AI output is editable, dismissible, or revertible; nothing dispatches without explicit confirmation |

**The headline:** *AI does the cross-referencing and first-draft writing in seconds; the dispatcher does the judgement call. Time-to-dispatch drops, but human accountability stays exactly where it should be.*

---

## Speaker tips

- **Pace:** Don't try to read every bullet aloud — let the visuals carry the data. Narrate the *meaning*, not the *content*.
- **Pause** for ~2 s after Scene 1 so the audience reads the trigger banner themselves. Same after Scene 3 (the aggregate confidence line).
- **If asked "is this real CV?"** — be honest: *"This is a presentation harness with scripted timings. The architecture — manifest schema, banner, evidence model, relevance scoring — is built so swapping in a real detection model and a real correlation engine is a future hook, not a rewrite."* (See `§9 Future Hooks` in the requirements doc.)
- **If asked about responsible AI** — point at three things in order: (1) the Copilot icon on every AI-generated artifact, (2) the editable summary with edit provenance, (3) the explicit `Acknowledge` / `Dismiss` actions on V0.
- **Reset** between rehearsals using the **Reset demo** button at the top right.

---

## Timing budget cheat sheet

| Scene | Window | Cumulative |
|---|---|---|
| 1 — Trigger appears | 0:00 → 0:10 | 0:10 |
| 2 — Primary feed connects | 0:10 → 0:20 | 0:20 |
| 3 — Corroborating evidence | 0:20 → 0:35 | 0:35 |
| 4 — Related incidents | 0:35 → 0:50 | 0:50 |
| 5 — Summary drafts | 0:50 → 1:10 | 1:10 |
| 6 — Operator edits | 1:10 → 1:25 | 1:25 |
| 7 — Validate & dispatch | 1:25 → 1:30 | **1:30** |

---

## Optional 30-second elevator cut

If you only have 30 seconds, run **Scenes 1, 3, and 5** back-to-back and finish with the takeaway line: *"AI does the cross-referencing and first-draft writing; the dispatcher keeps the judgement call."*
