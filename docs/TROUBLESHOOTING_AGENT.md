## 1. Agent not taking turns with the caller

### Issue
The Emergency Services agent did not wait for the caller to respond before asking the next question. It would ask multiple questions in one turn, behave more like a monologue than a real call, and the voice activity detection (VAD) would cut off user speech mid-sentence.

### Root Cause
Three components contributed to the behaviour:

1. **Agent instructions lacked explicit turn-taking rules** — The prompt said "one section at a time" but the model interpreted that as delivering all questions within a section in a single response, rather than waiting for a reply between each one.

2. **Initial greeting trigger was too broad** — The prompt used to start the conversation said "Answer the call and identify the emergency", which encouraged the model to ask several questions upfront to "identify" the situation.

3. **Voice Activity Detection (VAD) had no tuning** — The `azure_semantic_vad` was running on default settings, causing it to cut off the user before they finished speaking (low silence threshold, no prefix padding).

### Fix

**`backend/src/services/managers.py` — `BASE_INSTRUCTIONS`**
Added explicit turn-taking rules to the shared agent instructions:
- *Ask only ONE question per turn, then STOP and WAIT for the caller to reply*
- *Do NOT ask multiple questions in the same response*
- *Do NOT list upcoming questions or sections*

**`data/scenarios/emergency-*.role-play.prompt.yml` (all 4 files) — `BEHAVIOUR GUIDELINES`**
Added the same one-question-per-turn rules to each scenario's own instructions to reinforce the behaviour at the scenario level.

**`backend/src/services/websocket_handler.py` — `_send_initial_greeting()`**
Changed the trigger text from `"Answer the call and identify the emergency"` to `"A caller has just connected. Greet them with your opening line only."` so the agent only delivers the opening line and then waits.

**`backend/src/services/websocket_handler.py` — `_build_session_config()`**
Tuned the VAD parameters to better capture natural speech:
- `silence_duration_ms: 800` — waits 800 ms of silence before treating the user as done speaking
- `prefix_padding_ms: 500` — captures audio 500 ms before detected speech to avoid clipping the start of words
- `threshold: 0.6` — raises the detection threshold slightly to reduce false triggers from background noise

### Status
Fixed. Restart the backend to apply changes.



# issue 2 not able to analyse the call logs

### Issue
Clicking "Generate Case Report" after a completed call shows "Case Extraction Error: The case form could not be extracted."

### Root Cause
`AZURE_OPENAI_ENDPOINT` in `.env` uses the new Azure AI Foundry format ending with `/openai/v1`
(e.g. `https://xxx.openai.azure.com/openai/v1`). The `AzureOpenAI` Python SDK appends its own
`/openai/` prefix to whatever `azure_endpoint` is given, resulting in a doubled path:
`https://xxx.openai.azure.com/openai/v1/openai/deployments/…` — a URL that Azure rejects with 404.

### Fix
`backend/src/services/analyzers.py` — `_initialize_openai_client()`
Strips `/openai/v1` (or `/openai`) from the endpoint before passing it to `AzureOpenAI`, so the SDK
constructs the correct path:
`https://xxx.openai.azure.com/openai/deployments/{model}/chat/completions?api-version=…`

`exc_info=True` also added to the error-model catch block so full tracebacks appear in backend logs
if the model call fails for any other reason.

### Status
Fixed. Restart the backend to apply.


## create an option in the main emergency scenario as a hard coded call \
 create and option when selecting the emergency scenario in the main app menu to showcase as hardcoded call to simulate an emergency where the caller reports a fire in a building in suntec city and sees that there are people injured and they have heard some explosions and they are standing infront of a japansese restaurant called chotomatte. this example should allow the user to select "Generate Case Report"