# Architecture & Data Flow Diagrams

## System Overview

This document contains sequence diagrams and data flow diagrams to help understand which parts of the code control which behavior in the MTX Emergency Dispatcher Console.

> **Scope:** this describes **live mode** (the real Azure voice pipeline). The scripted demo path
> is documented separately in [docs/DEMO_ARCHITECTURE.md](docs/DEMO_ARCHITECTURE.md).

---

## 1. High-Level System Architecture

```mermaid
graph TB
    Client["Client Browser"]
    Frontend["Frontend<br/>(React/TypeScript)"]
    Backend["Flask Backend<br/>(Python)"]
    Azure["Azure Services<br/>(AI, Speech, Voice)"]

    Client -->|HTTP/WebSocket| Frontend
    Frontend -->|REST API| Backend
    Frontend -->|WebSocket ws://| Backend
    Backend -->|Proxy Connection| Azure
    Azure -->|Real-time Audio/Agents| Backend
    Backend -->|Forwarded Messages| Frontend

    style Backend fill:#4A90E2
    style Frontend fill:#7ED321
    style Azure fill:#F5A623
    style Client fill:#BD10E0
```

---

## 2. WebSocket Connection & Voice Proxy Flow

```mermaid
sequenceDiagram
    participant Client
    participant Frontend as Frontend<br/>useRealtime Hook
    participant Backend as Flask App<br/>@sock.route
    participant VoiceProxy as VoiceProxyHandler
    participant Azure as Azure Voice API

    Client->>Frontend: Start conversation
    Frontend->>Backend: WebSocket connection request
    Backend->>VoiceProxy: handle_connection()

    VoiceProxy->>VoiceProxy: _get_agent_id_from_client()
    VoiceProxy->>Backend: Receive agent_id from client

    VoiceProxy->>Azure: _connect_to_azure(agent_id)
    Azure-->>VoiceProxy: Azure WebSocket established

    VoiceProxy->>Frontend: Send proxy.connected message
    Frontend->>Client: Display connection status

    Note over VoiceProxy: Bidirectional message forwarding
    Frontend->>VoiceProxy: Audio/text message
    VoiceProxy->>Azure: Forward to Azure
    Azure-->>VoiceProxy: Response message
    VoiceProxy->>Frontend: Forward response

    Client->>Frontend: End session
    Frontend->>VoiceProxy: Close WebSocket
    VoiceProxy->>Azure: Close connection
```

---

## 3. Agent Creation & Management Flow

```mermaid
graph LR
    User["User Selects Scenario"]
    API["POST /api/agents/create"]
    AgentMgr["AgentManager<br/>create_agent()"]
    AIClient["AIProjectClient<br/>Agents API"]
    Manager["AgentManager<br/>Store agent_id"]
    Return["Return agent_id<br/>to Frontend"]

    User -->|Request| API
    API -->|agent_mgr.create_agent| AgentMgr
    AgentMgr -->|Azure SDK| AIClient
    AIClient -->|Create via REST| Return
    Return -->|Store in memory| Manager
    Manager -->|Return to client| User

    style AgentMgr fill:#4A90E2
    style AIClient fill:#F5A623
    style API fill:#50E3C2
```

---

## 4. Scenario Loading & Management

```mermaid
graph TD
    Init["App Initialization"]
    ScenarioMgr["ScenarioManager.__init__()"]
    LoadScenarios["_load_scenarios()"]
    FindFiles["Scan data/scenarios<br/>for *-role-play.prompt.yml"]
    LoadYAML["Load & Parse YAML"]
    Store["Store in self.scenarios<br/>Dict"]

    GraphGen["GraphScenarioGenerator<br/>Initialize"]

    Init -->|Create Instance| ScenarioMgr
    ScenarioMgr -->|Call on init| LoadScenarios
    LoadScenarios -->|Glob Pattern| FindFiles
    FindFiles -->|Read Files| LoadYAML
    LoadYAML -->|Parse| Store
    ScenarioMgr -->|Initialize| GraphGen

    GetScenario["get_scenario(id)"]
    Store -->|Query| GetScenario
    GetScenario -->|Check Local or Generated| Return["Return Scenario Data"]

    style ScenarioMgr fill:#4A90E2
    style LoadScenarios fill:#50E3C2
    style GraphGen fill:#F5A623
```

---

## 5. Conversation Analysis Flow

```mermaid
sequenceDiagram
    participant Client
    participant Backend as Flask<br/>POST /api/analyze
    participant ConvAnalyzer as ConversationAnalyzer
    participant AzureOpenAI as Azure OpenAI
    participant PronAssessor as PronunciationAssessor
    participant AzureSpeech as Azure Speech Services

    Client->>Backend: Send transcript + audio
    Backend->>ConvAnalyzer: analyze_conversation(transcript)

    ConvAnalyzer->>ConvAnalyzer: _load_evaluation_scenarios()
    ConvAnalyzer->>ConvAnalyzer: _generate_analysis_prompt()

    ConvAnalyzer->>AzureOpenAI: chat.completions.create()
    AzureOpenAI-->>ConvAnalyzer: Analysis result

    Backend->>PronAssessor: assess_pronunciation(audio)
    PronAssessor->>PronAssessor: _convert_audio_to_wav()

    PronAssessor->>AzureSpeech: Pronunciation Assessment
    AzureSpeech-->>PronAssessor: Pronunciation scores

    PronAssessor->>Backend: Return scores
    ConvAnalyzer->>Backend: Return analysis

    Backend->>Client: Combined analysis response
```

---

## 6. Data Flow: Frontend to Backend Communication

```mermaid
graph TB
    subgraph Frontend["Frontend React Components"]
        App["App.tsx"]
        ChatPanel["ChatPanel.tsx"]
        VideoPanel["VideoPanel.tsx"]
        AssessPanel["AssessmentPanel.tsx"]
    end

    subgraph Hooks["React Hooks"]
        Realtime["useRealtime<br/>WebSocket Management"]
        Recorder["useRecorder<br/>Audio Capture"]
        Player["useAudioPlayer<br/>Audio Playback"]
        Scenarios["useScenarios<br/>Scenario API"]
    end

    subgraph APIs["API Services"]
        ApiService["api.ts<br/>Fetch Wrapper"]
    end

    subgraph Backend["Backend Endpoints"]
        Config["/api/config"]
        Scenarios_EP["/api/scenarios"]
        Analyze["/api/analyze"]
        Create_Agent["/api/agents/create"]
        WS["/ws/voice"]
    end

    App -->|Controls| ChatPanel
    App -->|Controls| VideoPanel
    App -->|Controls| AssessPanel

    ChatPanel -->|Use| Realtime
    VideoPanel -->|Use| Recorder
    VideoPanel -->|Use| Player
    AssessPanel -->|Use| Scenarios

    Realtime -->|Send/Receive| WS
    Recorder -->|Send Audio| Analyze
    Scenarios -->|Fetch List| Scenarios_EP
    Scenarios -->|Fetch Detail| Scenarios_EP
    ApiService -->|Used by hooks| Hooks
    ApiService -->|Make Requests| APIs

    style Frontend fill:#7ED321
    style Hooks fill:#50E3C2
    style Backend fill:#4A90E2
    style Analyze fill:#F5A623
    style WS fill:#F5A623
```

---

## 7. Message Flow Through WebSocket

```mermaid
graph LR
    subgraph Client["Client Side"]
        Send["Frontend Sends:<br/>Audio/Text"]
    end

    subgraph Proxy["Proxy Handler<br/>websocket_handler.py"]
        Receive["Receive from client_ws"]
        Forward["Forward to azure_ws"]
        Back["Receive from azure_ws"]
        SendBack["Send to client_ws"]
    end

    subgraph Server["Azure Voice API"]
        Process["Process Audio<br/>Generate Response"]
    end

    Send -->|Message| Receive
    Receive -->|Parse JSON| Forward
    Forward -->|Async Send| Process
    Process -->|Response| Back
    Back -->|Parse JSON| SendBack
    SendBack -->|Message| Client

    style Proxy fill:#4A90E2
    style Server fill:#F5A623
    style Client fill:#7ED321
```

---

## 8. Audio Processing Pipeline

```mermaid
graph TD
    Start["User Speaks"]
    Capture["useRecorder<br/>Records Audio"]
    Format["Convert to<br/>WAV Format"]

    Split1{Send Where?}

    Path1["To Azure Voice API<br/>via WebSocket"]
    Path2["To Analysis Endpoint<br/>POST /api/analyze"]

    Path1 -->|Real-time| Process1["Azure Realtime Processing<br/>Transcription + Response"]
    Path2 -->|After Recording| Process2["ConversationAnalyzer<br/>+ PronunciationAssessor"]

    Process1 -->|Response Audio| PlayBack["useAudioPlayer<br/>Play Response"]
    Process2 -->|Analysis Scores| Display["Display Assessment<br/>Panel Results"]

    PlayBack -->|User Hears| End["Conversation Continues"]
    Display -->|User Sees| End

    style Capture fill:#50E3C2
    style Process1 fill:#F5A623
    style Process2 fill:#F5A623
    style End fill:#7ED321
```

---

## 9. Code Module Relationships

```mermaid
graph TB
    App["app.py<br/>Flask Application<br/>Entry Point"]

    App -->|Imports| ScenarioMgr["managers.py<br/>ScenarioManager"]
    App -->|Imports| AgentMgr["managers.py<br/>AgentManager"]
    App -->|Imports| ConvAnalyzer["analyzers.py<br/>ConversationAnalyzer"]
    App -->|Imports| PronAssessor["analyzers.py<br/>PronunciationAssessor"]
    App -->|Imports| VoiceProxy["websocket_handler.py<br/>VoiceProxyHandler"]

    ScenarioMgr -->|Uses| GraphGen["graph_scenario_generator.py<br/>GraphScenarioGenerator"]
    ScenarioMgr -->|Uses| ScenarioUtils["scenario_utils.py"]

    AgentMgr -->|Uses| AzureSDK["Azure AI Projects SDK"]
    AgentMgr -->|Uses| Config["config.py<br/>Configuration"]

    ConvAnalyzer -->|Uses| AzureOpenAI["Azure OpenAI<br/>gpt-4o"]
    ConvAnalyzer -->|Uses| ScenarioUtils
    ConvAnalyzer -->|Uses| Config

    PronAssessor -->|Uses| AzureSpeech["Azure Speech<br/>Pronunciation API"]
    PronAssessor -->|Uses| Config

    VoiceProxy -->|Uses| AgentMgr
    VoiceProxy -->|Uses| Config

    Config -->|Loads| DotEnv[".env Configuration"]

    style App fill:#4A90E2,color:#fff
    style ScenarioMgr fill:#50E3C2
    style AgentMgr fill:#50E3C2
    style ConvAnalyzer fill:#50E3C2
    style PronAssessor fill:#50E3C2
    style VoiceProxy fill:#50E3C2
    style AzureSDK fill:#F5A623
    style AzureOpenAI fill:#F5A623
    style AzureSpeech fill:#F5A623
```

---

## Key Behavioral Controls

### WebSocket Real-time Voice Behavior
- **Controller**: `websocket_handler.py` - `VoiceProxyHandler.handle_connection()`
- **Behavior**: Bidirectional message forwarding between client and Azure Voice API
- **Files**: `frontend/src/hooks/useRealtime.ts` (client-side)

### Patient Feedback Analysis Behavior
- **Controller**: `analyzers.py` - `ConversationAnalyzer.analyze_conversation()`
- **Behavior**: Evaluates patient feedback transcripts using Azure OpenAI against evaluation prompts
- **Scoring Categories**:
  - Patient Sentiment (40 pts): emotional tone, care satisfaction, trust & confidence
  - Service Quality (35 pts): communication, coordination, discharge process, pain management
  - Follow-up Requirements (25 pts): clinical urgency, admin follow-up, emotional support, patient education
- **Outputs**: Critical flags, key concerns, positive feedback, recommended actions, summary

### Pronunciation Assessment Behavior
- **Controller**: `analyzers.py` - `PronunciationAssessor.assess_pronunciation()`
- **Behavior**: Analyzes audio pronunciation using Azure Speech Services
- **Output**: Accuracy scores, fluency metrics, prosody assessments

### Scenario Management Behavior
- **Controller**: `managers.py` - `ScenarioManager.list_scenarios()` & `get_scenario()`
- **Behavior**: Loads emergency call scenarios from YAML files in `data/scenarios/`
- **Scenarios**: Fire, medical, accident, crime
- **Storage**: In-memory dictionary, supports both static and dynamically generated scenarios

### Agent Creation Behavior
- **Controller**: `managers.py` - `AgentManager.create_agent()`
- **Behavior**: Creates Azure AI agents for specific feedback scenarios using Azure AI Projects SDK
- **Integration**: Agents are passed to clients and used in WebSocket connections
