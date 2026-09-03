# Developer Troubleshooting — mtx-call-analysis Frontend

---

## Issue 1: `npm run dev` fails with `Cannot find module @rollup/rollup-linux-arm64-gnu`

**Cause:** `node_modules` was installed from one OS environment (e.g. PowerShell / Windows) but `npm run dev` was run from a different environment (e.g. WSL / Linux). Rollup ships platform-specific native binaries and they do not cross over.

**Fix (WSL):**
```bash
cd /mnt/c/Users/antoniachen/mtx-call-demo/mtx-call-analysis/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Fix (PowerShell):** Run `npm run dev` in the same PowerShell terminal where you originally ran `npm install`. Do not mix environments.

**Rule:** Always use the **same shell** for both `npm install` and `npm run dev`.

---

## Issue 2: Vite console spam — `http proxy error: /api/config` and `/api/scenarios`

**Cause:** The backend (`uvicorn` on port 8000) is not running, so every proxied API call gets `ECONNREFUSED`.

**Fix (preferred for demo mode):** Use the `?demo=1` query parameter — no backend required.

**Silent proxy** (already applied in `vite.config.ts`):
```ts
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    configure: (proxy) => {
      proxy.on('error', () => { /* suppress when backend not running */ })
    },
  },
}
```

`useScenarios.ts` also skips `api.getScenarios()` when `?demo=1` is present, so no network calls are made for the demo shell.

---

## Issue 3: Blank grey screen / scenario picker dialog appears instead of dispatcher workspace

**Cause:** Navigating to `http://localhost:5173/` without the `?demo=1` query parameter loads the normal live-call flow, which shows a setup dialog while waiting for scenarios from the backend.

**Fix:** Open the demo shell with the full URL:

```
http://localhost:5173/?demo=1
```

| URL | What you see |
|---|---|
| `localhost:5173/` | Normal flow — scenario picker dialog (needs backend) |
| `localhost:5173/?demo=1` | Demo dispatcher workspace with fixture data |

---

## Issue 4: White screen when dispatch summary appears after call ends

**Symptom:** Everything works until the call ends. About 1.5 s after the final turn (while "AI generating dispatch summary…" is visible) the whole screen goes white with no error shown in the UI.

**Root cause:** `useEditableDispatchSummary` mirrors the `aiDraft` prop into internal `draft` state via a `useEffect`. When `aiDraft` transitions from `null` → `DispatchSummary`, React renders **once** before the effect fires — `draft` is still `null` on that render while `aiDraft` is truthy. `DispatchSummaryPanel` passes the `if (!aiDraft || loading)` guard and falls through to render bullet lists, calling `summary[section].map(...)` on a null object. This is an uncaught `TypeError` that React's error boundary catches and replaces with a blank white screen.

**Fix applied (2026-04-21):**

1. **`frontend/src/hooks/useEditableDispatchSummary.ts`** — The returned `summary` and `finalSummary` values now fall back to `aiDraft` when the internal `draft` has not yet synced:
   ```ts
   const displayedDraft = draft ?? aiDraft
   // summary: editing ? working : displayedDraft
   ```
   `activeTab` also uses this fallback so the correct tab is shown even on the first render.

2. **`frontend/src/components/DispatchSummaryPanel.tsx`** — Removed the `editor.summary!` non-null assertion and replaced it with an explicit null guard:
   ```tsx
   const summary = editor.summary
   if (!summary) {
     return /* "Preparing summary…" placeholder */
   }
   ```
   Also stabilised the Esc-key `useEffect` dependency from `[editor]` (a new object reference every render) to `[editor.editing]` (a stable boolean).

**Rule of thumb:** Never assume that prop-to-state mirroring via `useEffect` takes effect on the same render that the prop changed. Always fall back to the prop itself on first render.

---

## Starting the full stack (when backend is needed)

```powershell
# Terminal 1 — backend
cd backend
pip install -r requirements.txt
uvicorn src.app:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173/` (no `?demo=1`) for the live-call flow.


## Issue 5: Knowledge Base Chat with knowledge base not resetting to original start when "Reset call"

When "Reset Call" is selected, the Knowledge Base Chat is not reset. You cannot see the recommended promtps.