# Demo-Mode Deployment Notes

**Document version:** 1.0
**Status:** Draft
**Owner:** Frontend / Demo
**Scope:** Mocked / scripted demo experience only — call demo ([DEMO_REQUIREMENTS.md](DEMO_REQUIREMENTS.md)) + video-analytics demo ([VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md)).
**Companion docs:** [DEMO_ARCHITECTURE.md](DEMO_ARCHITECTURE.md), [DEPLOYMENT_NOTES.md](../DEPLOYMENT_NOTES.md) (full / live-mode deployment).

---

## 1. Purpose

Document everything needed to run, package, and deploy **only the mocked demo portion** of the dispatcher console. The live voice pipeline (Azure VoiceLive proxy, Speech, OpenAI, agent IDs) is covered separately in [DEPLOYMENT_NOTES.md](../DEPLOYMENT_NOTES.md) and is **not required** for any of the workflows below.

> **Headline:** demo mode runs with **zero Azure credentials, zero LLM keys, and zero network egress beyond the static asset route**. A laptop with Node.js + Python is enough.

---

## 2. What demo mode needs (and doesn't)

### 2.1 Required

| Concern | Demo mode | Live mode (for contrast) |
|---|---|---|
| Node.js | ≥ 18 LTS (for Vite) | Same |
| Python | ≥ 3.11 (for Flask) | Same |
| Azure subscription | **Not required** | Required |
| Azure AI Foundry / agent IDs | **Not required** | Required |
| Azure Speech keys | **Not required** | Required |
| Azure OpenAI keys | **Not required** | Required |
| Outbound internet from container | **Not required** | Required |
| Microphone permission in browser | **Not required** | Required |
| WebSocket upgrade support on host | **Not required** for demo flows | Required |

### 2.2 What ships with the demo

- **Call-demo scenarios:** `data/scenarios/*.prompt.yml` (transcript, form patches, dispatch summary, knowledge Q&A).
- **Video-demo scenarios:** `data/video-scenarios/<id>/manifest.yml` + `*.mp4` + `thumbs/*.jpg`.
- **Frontend fixtures:** [callerDirectory.ts](../frontend/src/data/callerDirectory.ts), [demoScenarios.ts](../frontend/src/data/demoScenarios.ts), [videoScenarios.ts](../frontend/src/data/videoScenarios.ts).
- **Static asset route:** `GET /video-assets/<scenario>/<file>` in [backend/src/app.py](../backend/src/app.py).

---

## 3. Local development (demo-only)

### 3.1 Frontend-only (fastest path — no Python required)

The voice-call demo and the video-analytics demo both run end-to-end against Vite alone, because:

- Conversation turns, dispatch summaries, knowledge answers, AI triggers, related feeds, and related incidents are bundled fixtures.
- mp4 / jpg assets are served by **a Vite dev-server middleware** in [frontend/vite.config.ts](../frontend/vite.config.ts) that maps `/video-assets/<scenario>/<file>` directly to `data/video-scenarios/<scenario>/<file>` on disk.
- The `/api/*` proxy in `vite.config.ts` is wrapped in a `proxy.on('error', …)` no-op so missing-backend errors are suppressed in demo mode.

```powershell
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

Pick the *Video: Apartment fire — Blk 84 Commonwealth Crescent* scenario (or any `is_demo: true` call scenario) and click **Start demo**.

### 3.2 Frontend + Flask (full local parity)

Run the backend if you want the production code path for `/video-assets` and `/api/scenarios`:

```powershell
# Terminal 1 — backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m src.app

# Terminal 2 — frontend (Vite proxy will forward /api and /video-assets to Flask)
cd frontend
npm run dev
```

No `.env` file is needed for the demo flows. If `.env` is missing, Flask still starts; only the live-voice routes (`/voice-stream` WebSocket) will fail to initialize.

### 3.3 Verifying you are in demo mode

- The **AI Trigger Banner (V0)** populates from a YAML file (you can edit `data/video-scenarios/apartment-commonwealthcrescent/manifest.yml` and reload to confirm).
- The browser's network panel shows **only**:
  - One `GET /api/scenarios`.
  - 1–4 `GET /video-assets/<scenario>/*.mp4` (range requests).
  - No WebSocket upgrade. No outbound TLS to `*.azure.com` / `*.openai.azure.com` / `*.cognitiveservices.azure.com`.

---

## 4. Adding or modifying demo content

### 4.1 New call-demo scenario

1. Add a new `data/scenarios/<id>.prompt.yml` with `is_demo: true` plus `transcript[]`, `form_updates[]`, `dispatch_summary`, `knowledge_qa[]` per [DEMO_REQUIREMENTS.md §4.1](DEMO_REQUIREMENTS.md).
2. Mirror the relevant fields in [frontend/src/data/demoScenarios.ts](../frontend/src/data/demoScenarios.ts) so the frontend bundle has them.
3. If the scenario uses a new caller phone, add the entry to [frontend/src/data/callerDirectory.ts](../frontend/src/data/callerDirectory.ts).

### 4.2 New video-demo scenario

1. Create `data/video-scenarios/<scenario-id>/` with:
   - `manifest.yml` per [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §5.5](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md).
   - `primary.mp4`, `related-1.mp4`, `related-2.mp4`, `related-3.mp4`.
   - `thumbs/*.jpg` posters (optional but recommended).
2. Mirror the manifest in [frontend/src/data/videoScenarios.ts](../frontend/src/data/videoScenarios.ts) (this is the **frontend's** source of truth until the backend manifest loader is built — see [DEMO_ARCHITECTURE.md §9](DEMO_ARCHITECTURE.md)).
3. Verify the `<scenario-id>` in `videoScenarios.ts` matches the folder name on disk; the `getVideoAssetUrl()` helper builds `/video-assets/<scenario-id>/<file>` from it.

### 4.3 Asset constraints (per [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §6.2](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md))

- **mp4** (H.264 + AAC), ≤ 1280×720, ≤ 30 s, **≤ 5 MB each** to keep the repo lean.
- All clips play **muted** at the player level — no audio.
- Posters ≤ 200 KB each.

> Use `ffmpeg -i in.mp4 -vf "scale='min(1280,iw)':-2" -an -c:v libx264 -crf 26 -preset slow -movflags +faststart out.mp4` to re-encode oversized clips. The `-an` strips audio (saves bytes; we never play it). `+faststart` lets the browser begin playback before the file finishes downloading.

---

## 5. Container packaging

The demo ships as a **separate slim image** built from [backend/Dockerfile.demo](../backend/Dockerfile.demo). This image is independent of the full live-mode image ([backend/Dockerfile](../backend/Dockerfile)) and contains:

- The compiled SPA (frontend bundle).
- Only [backend/src/app_demo.py](../backend/src/app_demo.py) on the Python side — a minimal Flask app that serves the SPA, `/api/config`, `/api/scenarios` (returns `[]` so the frontend falls back to its bundled `DEMO_SCENARIOS` + `VIDEO_SCENARIOS` fixtures), and `/video-assets/<scenario>/<file>`.
- `data/video-scenarios/` (mp4 + jpg fixtures).
- A trimmed [backend/requirements-demo.txt](../backend/requirements-demo.txt) (`flask` only — no `azure-*`, `openai`, `flask-sock`, `pyyaml`, `dotenv`).

What the slim image deliberately does NOT contain:

| Excluded | Why |
|---|---|
| `backend/src/app.py` and `src/services/{analyzers,managers,websocket_handler,case_store}.py` | Live-mode LLM analyzer, Azure AI agent manager, VoiceLive WebSocket proxy, Cosmos DB store. |
| `data/scenarios/` and `data/graph-api-canned.json` | Live / call-demo scripts handled entirely by the frontend's bundled fixtures. |
| `azure-ai-projects`, `azure-identity`, `azure-cosmos`, `openai`, `flask-sock`, `pyyaml`, `python-dotenv`, `websockets` | Not needed by the slim runtime. |
| `build-essential`, `libasound2` | No native Python packages to compile. |
| `/api/analyze`, `/api/agents/*`, `/ws/voice` HTTP routes | Removed at the route level (not just disabled). |

Result: the slim image has a smaller attack surface (no live-mode endpoints reachable, no Azure SDKs in the runtime) and is materially smaller on disk than the full image.

### 5.1 Image size considerations

- The slim base (`python:3.11-slim-bookworm` + `flask` only) is ~150 MB before assets, vs. the full image's ~700 MB+ once `azure-*` / `openai` / `azure-cosmos` are pulled in.
- Each video scenario adds ≈ 4 × 5 MB = **~20 MB** of mp4 fixtures. With 5 scenarios that is +100 MB.
- If image size becomes a concern, mount video assets from an Azure Storage account at runtime instead of baking them in (future hook — not built in v1).

### 5.2 Build & run locally

```powershell
docker build -f backend/Dockerfile.demo -t mtx-call-demo:slim .
docker run --rm -p 8000:8000 mtx-call-demo:slim
# Open http://localhost:8000
```

No environment variables are required to exercise the demo flows in the container.

> **ARM hosts (Apple Silicon, ARM64 Windows) — important.** Docker Desktop on these machines builds **linux/arm64** images by default. Azure Container Apps runs **linux/amd64 only**, so an ARM-built image will start-fail in ACA with `exec format error`. When building locally for cloud deployment, always pin the platform:
>
> ```powershell
> docker build --platform linux/amd64 -f backend/Dockerfile.demo -t mtx-call-demo:slim .
> ```
>
> Or skip local Docker entirely and use `az acr build` (see §6.1, step 3a) — it builds on Azure's amd64 agents.

---

## 6. Cloud deployment (demo-only profile)

The full live-mode deployment is documented in [DEPLOYMENT_NOTES.md](../DEPLOYMENT_NOTES.md) and provisions Azure AI Foundry / Speech / OpenAI via Bicep. **For a demo-only deployment, none of those resources are needed.** The minimum target is a single container host that can serve HTTP.

The Azure-side resources required for the demo are:

| # | Resource | SKU / size | Why |
|---|---|---|---|
| 1 | Resource group | — | Container for everything below. |
| 2 | Azure Container Registry (ACR) | `Basic` | Holds the image. Skip only if you push to a registry you already control (Docker Hub, GHCR, etc.). |
| 3 | Container Apps environment | Consumption | Multi-tenant runtime; auto-creates a Log Analytics workspace. |
| 4 | Container App | 0.5 CPU / 1 GiB, 1 replica | The demo workload. |
| 5 | Log Analytics workspace | Pay-as-you-go | Created automatically by step 3. Negligible cost at demo traffic. |

No Key Vault, managed identity for data plane, VNet, private endpoint, Front Door, Storage account, or Application Insights instance is required for the demo profile.

### 6.1 Azure Container Apps (recommended for demo)

Prerequisites: `az` CLI installed and `az login` completed. Resource providers `Microsoft.App`, `Microsoft.OperationalInsights`, and `Microsoft.ContainerRegistry` must be registered on the target subscription (`az provider register -n Microsoft.App --wait` etc. — one-time).

```powershell
# 0. Variables
$rg     = "rg-mtx-demo"
$loc    = "southeastasia"           # pick the region you want
$acr    = "acrmtxdemo$(Get-Random -Maximum 9999)"   # globally unique, lowercase, <=50 chars
$caeEnv = "cae-mtx-demo"
$app    = "mtx-call-demo"
$image  = "$acr.azurecr.io/mtx-call-demo:slim"

# 1. Resource group
az group create -n $rg -l $loc

# 2. Azure Container Registry (Basic SKU is enough for a demo image; no admin user)
az acr create -n $acr -g $rg --sku Basic --admin-enabled false

# 3. Build the image. Pick ONE of 3a or 3b.
#    3a. Cloud build (recommended) - no local Docker needed, always builds linux/amd64
az acr build -r $acr --platform linux/amd64 -t mtx-call-demo:slim -f backend/Dockerfile.demo .

#    3b. Local build + push (REQUIRES --platform linux/amd64 on ARM hosts; see §5.2)
az acr login -n $acr
docker build --platform linux/amd64 -f backend/Dockerfile.demo -t $image .
docker push $image

# 4. Container Apps environment (creates a Log Analytics workspace by default)
az containerapp env create -n $caeEnv -g $rg -l $loc

# 5. The Container App, with a system-assigned managed identity that pulls from ACR
az containerapp create `
  -n $app -g $rg --environment $caeEnv `
  --image $image `
  --target-port 8000 --ingress external `
  --min-replicas 1 --max-replicas 1 `
  --cpu 0.5 --memory 1.0Gi `
  --system-assigned `
  --registry-server "$acr.azurecr.io" `
  --registry-identity system

# 6. Get the public URL
az containerapp show -n $app -g $rg --query properties.configuration.ingress.fqdn -o tsv
```

**Why this is enough:**

- No outbound network rules are needed (the container makes no Azure calls in demo mode).
- No Key Vault references, no app-level secrets.
- HTTP-only ingress is sufficient (the demo does not use WebSockets).
- 0.5 CPU / 1 GiB RAM comfortably handles the demo's static-file workload.
- The `--registry-identity system` flag has ACA create a system-assigned managed identity AND auto-grant it `AcrPull` on the registry — no admin credentials, no secrets stored on the app.

#### 6.1.1 Permissions you need on the deployer account

All roles are RBAC; assign on the resource group (or subscription) before running the script.

| Step | Action | Minimum role | Scope |
|---|---|---|---|
| 1 | `az group create` | `Contributor` | Subscription |
| 2 | `az acr create` | `Contributor` | RG |
| 3a | `az acr build` | `Contributor` on the registry (or `AcrPush`) | ACR |
| 3b | `docker push` / `az acr login` | `AcrPush` (implies `AcrPull`) | ACR |
| 4 | `az containerapp env create` | `Contributor` | RG |
| 5 | `az containerapp create` with `--registry-identity system` | `Contributor` on the app **and** `User Access Administrator` (or `Owner`) on the ACR — ACA needs to assign `AcrPull` to the new managed identity | App + ACR |
| (one-time, per sub) | `az provider register -n Microsoft.App` etc. | `Contributor` | Subscription |

> **`Contributor`-only fallback.** If you cannot get `User Access Administrator`/`Owner` on the ACR, ask someone who has it to pre-create the role assignment, then drop `--system-assigned` / `--registry-identity` from step 5:
>
> ```powershell
> # As an Owner of the ACR, after step 5 has created the app's managed identity:
> $miPrincipal = az containerapp show -n $app -g $rg --query identity.principalId -o tsv
> $acrId       = az acr show -n $acr -g $rg --query id -o tsv
> az role assignment create --assignee $miPrincipal --role AcrPull --scope $acrId
> ```
>
> Last-resort, demo-only fallback (NOT recommended for anything beyond a throwaway demo): enable the ACR admin user and pass credentials directly:
>
> ```powershell
> az acr update -n $acr --admin-enabled true
> $u = az acr credential show -n $acr --query username -o tsv
> $p = az acr credential show -n $acr --query passwords[0].value -o tsv
> # add to step 5: --registry-username $u --registry-password $p (drop --registry-identity / --system-assigned)
> ```

#### 6.1.2 Region & platform notes

- **Region.** Container Apps is not available in every region. List supported regions with `az provider show -n Microsoft.App --query "resourceTypes[?resourceType=='managedEnvironments'].locations" -o tsv`.
- **Image platform.** ACA only runs `linux/amd64`. If you build locally on Apple Silicon or ARM64 Windows, you **must** pass `--platform linux/amd64` (see §5.2). The `az acr build` path in step 3a handles this for you.

### 6.2 Other targets

| Target | Notes |
|---|---|
| **Azure App Service (Web App for Containers)** | Same image, same port. Disable the always-on health-check WebSocket ping — not used by demo. |
| **Static Web App + standalone Flask** | Possible but **not recommended** because the video assets must be served from the same origin as the SPA to avoid CORS on `<video>` element range requests; co-locating in one container is simpler. |
| **Local-only laptop demo** | `npm run dev` (frontend) covers it; see §3.1. |

---

## 7. Configuration & environment variables (demo-only)

| Variable | Required for demo? | Purpose |
|---|---|---|
| `FLASK_ENV` | No (defaults are fine) | — |
| `STATIC_FOLDER` | No (Dockerfile sets it) | Resolves `index.html`. |
| `AZURE_*` (anything) | **No** | Live-mode only. Demo ignores them. |
| `VOICE_*` / `OPENAI_*` | **No** | Live-mode only. |

> Verify in CI that the demo image **starts cleanly with all `AZURE_*` env vars unset.** A regression here is the most common way demo deployments break.

---

## 8. Operational checklist

Before any live demo session:

- [ ] Image built from a green main commit (`backend/Dockerfile.demo`).
- [ ] `data/video-scenarios/` `COPY` line present in `backend/Dockerfile.demo` (§5).
- [ ] Container responds with HTTP 200 on `/`.
- [ ] `/api/config` returns `{"demo_only": true, ...}` (slim image marker).
- [ ] `/video-assets/apartment-commonwealthcrescent/primary.mp4` returns HTTP 206 with `Content-Type: video/mp4`.
- [ ] Browser zoom is set so V0, V1, V4, V6, V8 are all visible without scrolling at 1440 × 900.
- [ ] Browser console is clean (no 404s, no CORS errors, no missing-asset warnings).
- [ ] Audio is muted at the OS level (every video plays muted, but a paranoia mute saves the day on Bluetooth speakers).
- [ ] **Reset demo** button works after one full play-through (clean state for the next rehearsal).

---

## 9. Troubleshooting (demo-specific)

| Symptom | Likely cause | Fix |
|---|---|---|
| V1 stays on "Connecting to Camera …" indefinitely | `/video-assets/.../primary.mp4` returns 404 | Check that `data/video-scenarios/` was copied into the image (§5). In dev, check that the scenario folder name matches the `id` in `videoScenarios.ts`. |
| V4 tiles render but show black frames | mp4 is missing the `+faststart` flag, or codec is not H.264 | Re-encode per §4.3. |
| V0 banner never advances past `Awaiting trigger…` shimmer | `useVideoDemo` start handler not invoked (Start overlay still up) | Click **Start demo**. |
| `Acknowledge & dispatch` does nothing | Operator hit the disabled state after a previous Acknowledge; click **Reset demo**. | — |
| Image is very large (> 500 MB) | Video assets oversized | Re-encode mp4s under 5 MB each (§4.3). |
| Network panel shows calls to `*.openai.azure.com` | A scenario was launched with `is_demo: false` / a non-`kind: video` flow | Pick a demo scenario. |
| `404 scenario not found` from `/video-assets/<id>/...` | Folder name mismatch between disk and `videoScenarios.ts` | Rename one to match the other. |

---

## 10. Out of scope (deliberate)

- Authentication / authorization for `/video-assets`. The demo route is public; do not host it as a real production surface without adding auth.
- Persistence of operator edits to dispatch summaries (see [DEMO_REQUIREMENTS.md §8](DEMO_REQUIREMENTS.md) future hook).
- Real CV / correlation engines (see [VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §9](VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md) future hook).
- CDN / edge-cache configuration for video assets. Demo assets are small enough to serve from origin.
- Multi-tenant scenario isolation. The demo image bundles every scenario; there is no per-customer filtering.
