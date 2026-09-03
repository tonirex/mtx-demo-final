# UI/UX Requirements — Multi-Panel Call Center Workspace

**Document version:** 1.0
**Status:** Draft
**Owner:** Frontend / UX
**Related app:** `mtx-call-analysis` (emergency call analysis operator console)

---

## 1. Purpose

Define the user-interface and user-experience requirements for an emergency-call dispatcher console. The reference v1 wireframe is a **three-column workspace** that gives a single dispatcher parallel access to:

1. An **Information panel** — structured form the operator fills/edits during the call (left).
2. A **Real-time conversation transcript** — live chat between caller and operator (center).
3. A combined **Knowledge-base chat** + **AI-generated Dispatch Summary** panel (right, vertically split).

A future variant (§4–§7) extends this with a work-queue sidebar and a dedicated Copilot panel for the broader call-center scenario.

This document is intended as input for component design, implementation, and acceptance testing.

---

## 2. Personas & Primary Goals

| Persona | Goal | Key needs |
|---|---|---|
| **Call center operator** | Handle multiple concurrent conversations efficiently | At-a-glance triage, fast context switching, AI assistance |
| **Supervisor (secondary)** | Monitor sentiment and workload | Visible status pills, sentiment indicators |
| **Knowledge agent (AI)** | Provide grounded answers and drafts | Clear AI affordances, responsible-AI disclosure |

---

## 3. Overall Layout

The workspace uses a **three-column primary layout** tailored to the emergency-call dispatcher workflow, with an optional fourth column (Copilot) reserved for the broader call-center variant described in §4–§7.

The dispatcher layout (per the v1 wireframe) is:

```
┌────────────────────────┬────────────────────────┬────────────────────────┐
│  LEFT — Information    │  CENTER — Real-time    │  RIGHT (top)           │
│  panel (operator form) │  conversation          │   Chat with knowledge  │
│                        │  transcript            │   base                 │
│                        │                        │ ───────────────────── │
│                        │                        │  RIGHT (bottom)        │
│                        │                        │   AI-generated         │
│                        │                        │   Dispatch Summary     │
│                        │                        │   (FIRE / POLICE /     │
│                        │                        │    MEDICAL tabs)       │
│                        │                        │                        │
│  [ Submit ]            │  [ Type something … ]  │                        │
└────────────────────────┴────────────────────────┴────────────────────────┘
```

### 3.1 Column proportions (desktop ≥ 1440 px)
| Column | Width (approx.) | Min width | Scroll |
|---|---|---|---|
| Left — Information panel | 30 % | 360 px | Vertical |
| Center — Conversation transcript | 35 % | 380 px | Vertical, auto-scroll to latest |
| Right — Knowledge chat + Dispatch Summary | 35 % | 380 px | Each sub-panel scrolls independently |

### 3.2 Vertical placement within each column
- **Left column:** Form header → grouped form fields (top → bottom in reading order) → primary `Submit` action **anchored at the bottom-left**.
- **Center column:** `Messages` title bar (top, fixed) → scrolling transcript (fills remaining height) → composer input **anchored at the bottom**.
- **Right column:** Split horizontally into two stacked sub-panels of roughly equal height, separated by a thin divider:
  1. **Top sub-panel — `Chat with knowledge base`** (operator ↔ AI knowledge agent).
  2. **Bottom sub-panel — `AI-generated Dispatch Summary`** with a tab strip (`FIRE`, `POLICE`, `MEDICAL ASSISTANCE`) at the top of the sub-panel.

### 3.3 General rules
- Each column is an **independent, vertically scrollable panel** separated by thin dividers.
- **Primary actions** (`Submit`, `Send`, `Dispatch`) are anchored to the bottom of their owning panel.
- **Tab strips** sit at the top of the panel they control.
- Layout is **responsive**: on narrow screens, columns stack in the order *Conversation → Information → Knowledge/Dispatch*; the right column's two sub-panels become collapsible accordions.
- No primary navigation requires leaving the workspace during an active call.

---

## 3a. Core Component Placement (v1 Dispatcher Wireframe)

This section pins down **where each core component lives** in the v1 layout. It is the authoritative placement reference; §4–§7 describe the extended call-center variant.

### 3a.1 Component map

| # | Component | Column | Vertical zone | Anchored? |
|---|---|---|---|---|
| C1 | `InfoLog` form header | Left | Top | Fixed |
| C2 | Information panel form fields (call ID, time, address, city, state, reporter, …) | Left | Middle (scroll) | — |
| C3 | `Submit` button | Left | Bottom-left | Fixed to panel footer |
| C4 | `Messages` title bar | Center | Top | Fixed |
| C5 | Real-time conversation transcript (caller bubbles left, operator bubbles right) | Center | Middle (scroll, auto-stick to latest) | — |
| C6 | Message composer (`Type something here…` + send icon) | Center | Bottom | Fixed to panel footer |
| C7 | `Chat with knowledge base` sub-panel header + transcript + input | Right, **top half** | Top → Bottom of sub-panel | Input fixed at bottom of sub-panel |
| C8 | Sub-panel divider | Right | Mid-height | Fixed |
| C9 | Dispatch Summary tab strip (`FIRE` / `POLICE` / `MEDICAL ASSISTANCE`) | Right, **bottom half** | Top of sub-panel | Fixed |
| C10 | AI-generated Dispatch Summary content (bullet list) | Right, bottom half | Middle (scroll) | — |
| C11 | Dispatch / send-to-responder action button | Right, bottom half | Bottom-right of sub-panel | Fixed to sub-panel footer |

### 3a.2 Placement rules
- **Left column owns operator data entry.** Nothing AI-generated is written here without explicit operator confirmation.
- **Center column owns the live caller channel.** It must remain visible at all times during an active call; never overlaid by modals.
- **Right column owns AI surfaces** and is split 50/50 vertically:
  - **Top half = interactive AI** (knowledge-base chat — operator-driven Q&A).
  - **Bottom half = generated AI artifact** (Dispatch Summary — produced from the live transcript).
- **Tabs** in the Dispatch Summary sub-panel switch the *content* of that sub-panel only; they never affect the transcript or information panel.
- **Primary action buttons** are bottom-anchored within their owning panel: `Submit` (C3), Send-message (C6), Send-knowledge-query (C7), Dispatch (C11).
- **Destructive / irreversible actions** (e.g., `Dispatch`, future `End call`) use the red action color and require confirmation.

### 3a.3 Z-order and overlays
1. Base layout (three columns).
2. Tab content within Dispatch Summary.
3. Tooltips, dropdowns, autocomplete.
4. Confirmation modals (only for destructive actions; must not cover the conversation transcript — render centered over left or right column when possible).

### 3a.4 Empty / loading states per component
| Component | Empty state | Loading state |
|---|---|---|
| C2 Information panel | Placeholder text in each field; `Required` markers visible | Skeleton field rows |
| C5 Transcript | Centered hint: *"Waiting for caller…"* | Pulsing typing indicator |
| C7 Knowledge chat | Greeting + example prompts | Inline spinner under last message |
| C10 Dispatch Summary | *"Summary will appear once enough context is captured."* | Shimmer bullet rows; show `AI generating…` chip with Copilot icon |

---



**Purpose:** Prioritized list of active or assigned conversations.

### 4.1 Structure
- **Header:** Title `My work items` with controls: *search*, *refresh*, *filter*.
- **Grouping:** Collapsible time-based sections (`Today`, `Yesterday`, …) with item counts.

### 4.2 List item (card)
Each item must display:
- Avatar with **channel color coding** (e.g., green = chat, orange = voice, purple = social).
- Customer name.
- Queue / topic label (e.g., *Product inquiry*, *Warranty*).
- Status row: `Active` state, **sentiment chip** (Neutral / Positive / Negative with colored dot), timestamp.
- **Action cue:** A pill labeled `Your turn` when operator response is required.

### 4.3 States
- **Selection:** Active row uses a tinted background.
- **Hover:** Subtle elevation or background change.
- **Unread / needs action:** `Your turn` pill is the canonical indicator.

---

## 5. Panel 2 — Communication Panel (Live Conversation)

**Purpose:** Real-time interaction with the customer.

### 5.1 Header bar
- Customer avatar and name.
- Call/chat **duration timer**.
- **Sentiment badge** (live).
- **`End` button** — destructive, red, right-aligned, isolated from safe controls. Must require confirmation before terminating.

### 5.2 Transcript area
- **Inbound messages:** Left-aligned, with initials avatar.
- **Outbound messages:** Right-aligned, filled brand color, with **delivery checkmark**.
- **System events:** Centered, muted text (e.g., *"Conversation with Serena has started"*).
- Auto-scroll to latest message; preserve scroll position when user scrolls up.

### 5.3 Composer (footer)
- Single-line input with placeholder `Type your public message…`.
- Must support distinguishing **public message vs. internal note** (toggle or tab).
- Attachments and send action accessible via icon buttons.

---

## 6. Panel 3 — Customer / Case Details (Tabbed Context Panel)

**Purpose:** Reference data and case history. Designed as a **tabbed workspace** so multiple records can be open simultaneously.

### 6.1 Tab strip
- Browser/IDE-style tabs with close affordance (`Customer details ✕`).
- Active tab visually distinct; supports keyboard navigation.

### 6.2 Customer card section
- Customer name with expand chevron.
- Account ID.
- **Click-to-call** phone number.
- Masked email.
- Address.
- Each field uses an **icon + value row** for scannability.

### 6.3 Timeline section
- Header with controls: *add*, *filter*, *sort*, *overflow menu*.
- Search box scoped to timeline.
- Collapsible `Recent` group.

### 6.4 AI summary block — `Timeline highlights`
- Bulleted, AI-generated narrative of past interactions.
- Marked with the **Copilot icon** to indicate machine-generated content.
- Must be visually distinguishable from human-authored notes.

---

## 7. Panel 4 — Copilot Assistant (Right Sidebar)

**Purpose:** AI knowledge agent for the **operator** (not the customer).

### 7.1 Header
- `Copilot` brand mark.
- `Filters` control for scoping knowledge sources.

### 7.2 Mode tabs
- `Ask a question`
- `Write an email`
- (Extensible for future modes such as *Summarize* or *Suggest reply*.)

### 7.3 Empty state
- Friendly illustration.
- Personalized greeting (e.g., *"Hi Preston, what do you need?"*).
- Short instructional copy.

### 7.4 Guidance cards
Three icon + text tips covering:
1. Prompt quality (*"The more specific you are…"*).
2. Suggested usage (*"Use AI to identify the most recent customer problem…"*).
3. **Responsible-AI disclosure** (*"AI-generated content may be incorrect. Make sure AI-generated content is accurate and appropriate before using it."*) with link to terms.

---

## 8. Cross-Cutting UX Patterns

| Pattern | Requirement |
|---|---|
| **Information density via columns** | All four panels visible simultaneously on desktop; no modal blocks the conversation. |
| **Color-coded channel & sentiment** | Consistent palette across queue, header, and details. |
| **Status pills** (`Your turn`, `Active`, `Ended`) | Drive attention to the next required action. |
| **Tabbed detail pane** | Operators can keep multiple cases open without losing state. |
| **Inline AI affordances** | A consistent Copilot icon marks every AI-generated artifact. |
| **Destructive action isolation** | `End`, `Delete`, `Discard` use red and are spatially separated from safe controls; require confirmation. |
| **Empty states with onboarding** | Every panel teaches first-time usage. |
| **Icon + label pairing** | Every field and action exposes both icon and text. |

---

## 9. Visual Design Tokens (initial proposal)

| Token | Usage | Example |
|---|---|---|
| `color.channel.chat` | Chat avatar / accent | Green |
| `color.channel.voice` | Voice avatar / accent | Orange |
| `color.channel.social` | Social avatar / accent | Purple |
| `color.sentiment.positive` | Positive chip | Green dot |
| `color.sentiment.neutral` | Neutral chip | Gray dot |
| `color.sentiment.negative` | Negative chip | Red/Amber dot |
| `color.action.destructive` | `End`, delete | Red |
| `color.ai.accent` | Copilot icon, AI blocks | Brand purple/blue gradient |
| `radius.card` | Cards, pills | 6–8 px |
| `spacing.panel-gutter` | Between columns | 1 px divider + 12–16 px padding |

---

## 10. Accessibility Requirements

- **WCAG 2.1 AA** compliance.
- All color-coded indicators must include a **non-color cue** (icon, label, shape).
- Full **keyboard navigation**: tab order follows visual reading order; tabs in the details panel are arrow-key navigable.
- **Screen reader** labels for sentiment chips, `Your turn` pills, AI-generated blocks (announce as "AI generated").
- **Focus states** visible on all interactive elements.
- Minimum **contrast ratio 4.5:1** for text.
- Live regions announce new inbound messages and system events.

---

## 11. Responsible AI Requirements

- All AI-generated content must be **visually labeled** with the Copilot icon.
- A persistent disclosure ("AI-generated content may be incorrect…") must appear in the Copilot panel.
- Operators must be able to **edit or discard** AI suggestions before sending.
- Source citations should be shown when available.

---

## 12. Component Mapping to Existing Codebase

### 12.1 v1 Dispatcher layout (per §3a)

| Wireframe component | Existing/new component | Notes |
|---|---|---|
| C1–C3 Information panel + `Submit` | [frontend/src/components/CaseFormPanel.tsx](frontend/src/components/CaseFormPanel.tsx) | Add `Submit` action anchored at bottom-left; mark required fields. |
| C4–C6 Real-time conversation transcript | [frontend/src/components/ChatPanel.tsx](frontend/src/components/ChatPanel.tsx) | Caller bubbles left, operator bubbles right; composer fixed at bottom. |
| C7 Chat with knowledge base | New `KnowledgeChatPanel` | Lives in **top half** of right column. |
| C9–C11 AI-generated Dispatch Summary (FIRE / POLICE / MEDICAL tabs) | New `DispatchSummaryPanel` | Lives in **bottom half** of right column; tab strip at top, dispatch action bottom-right. |
| Right-column split container | New `RightSplitPanel` | Hosts `KnowledgeChatPanel` over `DispatchSummaryPanel` with a draggable divider (default 50/50). |

### 12.2 Extended call-center variant (§4–§7)

| Reference panel | Existing/new component | Notes |
|---|---|---|
| Work queue | [frontend/src/components/ScenarioList.tsx](frontend/src/components/ScenarioList.tsx) | Extend with grouping, sentiment chip, `Your turn` badge. |
| Communication panel | [frontend/src/components/ChatPanel.tsx](frontend/src/components/ChatPanel.tsx) | Add header bar with duration, sentiment, `End` button. |
| Customer details | New `CaseDetailsPanel` (tabs) | [frontend/src/components/CaseFormPanel.tsx](frontend/src/components/CaseFormPanel.tsx) becomes one tab. |
| Copilot assistant | New `AssistantPanel` | Mode tabs, empty state, guidance cards. |

---

## 13. Acceptance Criteria (high level)

1. Operator can see all four panels on a 1440 px wide desktop without horizontal scrolling.
2. Selecting a queue item updates the communication and details panels within 200 ms.
3. `Your turn` pill appears within 1 s of an inbound message requiring response.
4. `End` button always requires explicit confirmation.
5. AI-generated content is never rendered without the Copilot icon and disclosure.
6. All interactive elements are reachable and operable by keyboard alone.
7. Sentiment and channel are distinguishable without relying on color.

---

## 14. Out of Scope (v1)

- Supervisor analytics dashboards.
- Multi-operator collaboration / handoff UI.
- Customer-facing widgets.
- Telephony device configuration screens.

---

## 15. Open Questions

- Which channels must be supported in v1 (chat only, or chat + voice)?
- Should the Copilot panel be dockable / detachable?
- What is the maximum number of concurrent open case tabs?
- Confirmation pattern for `End` — modal vs. inline two-step?
