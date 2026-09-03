/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Dialog,
    DialogBody,
    DialogSurface,
    Spinner,
    Text,
    makeStyles,
    tokens,
} from '@fluentui/react-components'
import { useCallback, useState } from 'react'
import { CaseFormPanel } from '../components/CaseFormPanel'
import { ChatPanel } from '../components/ChatPanel'
import { DispatcherWorkspace } from '../components/DispatcherWorkspace'
import { ScenarioList } from '../components/ScenarioList'
import { VideoFeedWorkspace } from '../components/VideoFeedWorkspace'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { useRealtime } from '../hooks/useRealtime'
import { useRecorder } from '../hooks/useRecorder'
import { useScenarios } from '../hooks/useScenarios'
import { api } from '../services/api'
import { CaseResult, Message, VideoScenario } from '../types'

const useStyles = makeStyles({
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingVerticalL,
  },
  mainLayout: {
    width: '95%',
    maxWidth: '1400px',
    height: '90vh',
    display: 'flex',
    gap: tokens.spacingHorizontalL,
  },
  setupDialog: {
    maxWidth: '600px',
    width: '90vw',
  },
  loadingContent: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%',
  },
})

export default function App() {
  const styles = useStyles()
  const [showSetup, setShowSetup] = useState(true)
  const [showLoading, setShowLoading] = useState(false)
  const [showCaseForm, setShowCaseForm] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)
  const [caseResult, setCaseResult] = useState<CaseResult | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoMessages, setDemoMessages] = useState<Message[]>([])
  const [activeDemoScenario, setActiveDemoScenario] = useState<
    import('../types').Scenario | null
  >(null)
  const [activeVideoScenario, setActiveVideoScenario] =
    useState<VideoScenario | null>(null)

  const { scenarios, selectedScenario, setSelectedScenario, loading } =
    useScenarios()
  const { playAudio } = useAudioPlayer()
  const activeScenario =
    scenarios.find(s => s.id === selectedScenario) || null

  const { connected, messages, send, clearMessages, getRecordings } =
    useRealtime({
      agentId: currentAgent,
      onAudioDelta: playAudio,
    })

  const sendAudioChunk = useCallback(
    (base64: string) => {
      send({ type: 'input_audio_buffer.append', audio: base64 })
    },
    [send]
  )

  const { recording, toggleRecording } =
    useRecorder(sendAudioChunk)

  const handleStart = async () => {
    if (!selectedScenario) return

    const scenario = scenarios.find(s => s.id === selectedScenario)

    // Video Analytics demo: route into VideoFeedWorkspace
    if (scenario?.kind === 'video' && scenario.video) {
      setActiveVideoScenario(scenario.video)
      setShowSetup(false)
      return
    }

    // Demo mode: route into the new DispatcherWorkspace with the scenario fixture
    if (scenario?.is_demo) {
      setActiveDemoScenario(scenario)
      setShowSetup(false)
      // Also keep the legacy demo state populated so the analyze flow still works
      if (scenario.demo_transcript) {
        const msgs: Message[] = scenario.demo_transcript.map((turn, i) => ({
          id: `demo-${i}`,
          role: turn.role,
          content: turn.content,
          timestamp: new Date(),
        }))
        setDemoMessages(msgs)
        setIsDemoMode(true)
      }
      return
    }

    try {
      const { agent_id } = await api.createAgent(selectedScenario)
      setCurrentAgent(agent_id)
      setShowSetup(false)
    } catch (error) {
      console.error('Failed to create agent:', error)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedScenario) return

    setShowLoading(true)

    try {
      let transcript: string

      if (isDemoMode) {
        transcript = demoMessages
          .map(m => `${m.role}: ${m.content}`)
          .join('\n')
      } else {
        const recordings = getRecordings()
        if (!recordings.conversation.length) {
          setShowLoading(false)
          return
        }
        transcript = recordings.conversation
          .map((m: any) => `${m.role}: ${m.content}`)
          .join('\n')
      }

      const result = await api.analyzeConversation(
        selectedScenario,
        transcript
      )

      setCaseResult(result)
      setShowCaseForm(true)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setShowLoading(false)
    }
  }

  const displayMessages = isDemoMode ? demoMessages : messages

  const isDemoShell =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('demo') === '1'

  if (activeVideoScenario) {
    return <VideoFeedWorkspace scenario={activeVideoScenario} />
  }

  if (activeDemoScenario) {
    return <DispatcherWorkspace scenario={activeDemoScenario} />
  }

  if (isDemoShell) {
    return <DispatcherWorkspace />
  }

  return (
    <div className={styles.container}>
      <Dialog
        open={showSetup}
        onOpenChange={(_, data) => setShowSetup(data.open)}
      >
        <DialogSurface className={styles.setupDialog}>
          <DialogBody>
            {loading ? (
              <Spinner label="Loading scenarios..." />
            ) : (
              <ScenarioList
                scenarios={scenarios}
                selectedScenario={selectedScenario}
                onSelect={setSelectedScenario}
                onStart={handleStart}
              />
            )}
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={showLoading}>
        <DialogSurface>
          <DialogBody>
            <div className={styles.loadingContent}>
              <Spinner size="large" />
              <Text
                size={400}
                weight="semibold"
                block
                style={{ marginTop: tokens.spacingVerticalL }}
              >
                Generating Case Report...
              </Text>
              <Text
                size={200}
                block
                style={{ marginTop: tokens.spacingVerticalS }}
              >
                This may take up to 30 seconds
              </Text>
            </div>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <CaseFormPanel
        open={showCaseForm}
        caseResult={caseResult}
        onClose={() => setShowCaseForm(false)}
      />

      {!showSetup && (
        <div className={styles.mainLayout}>
          <ChatPanel
            messages={displayMessages}
            recording={recording}
            connected={connected}
            canAnalyze={displayMessages.length > 0}
            onToggleRecording={toggleRecording}
            onClear={clearMessages}
            onAnalyze={handleAnalyze}
            scenario={activeScenario}
            isDemoMode={isDemoMode}
          />
        </div>
      )}
    </div>
  )
}
