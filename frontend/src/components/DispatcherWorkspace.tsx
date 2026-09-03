/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Button,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    Text,
    Toast,
    ToastTitle,
    Toaster,
    makeStyles,
    tokens,
    useId,
    useToastController,
} from '@fluentui/react-components'
import { ArrowResetRegular, CallRegular, CheckmarkCircleFilled } from '@fluentui/react-icons'
import { useState } from 'react'
import { DEMO_SCENARIOS } from '../data/demoScenarios'
import { useDemoCall } from '../hooks/useDemoCall'
import { DispatchSummary, Scenario } from '../types'
import { DispatchSummaryPanel } from './DispatchSummaryPanel'
import { InfoPanel } from './InfoPanel'
import { KnowledgeChatPanel } from './KnowledgeChatPanel'
import { RightSplitPanel } from './RightSplitPanel'
import { TranscriptPanel } from './TranscriptPanel'

const useStyles = makeStyles({
  workspace: {
    width: '100%',
    height: '100vh',
    display: 'grid',
    gridTemplateColumns: '30fr 35fr 35fr',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    boxSizing: 'border-box',
    position: 'relative',
    '@media (max-width: 1100px)': {
      gridTemplateColumns: '1fr',
      height: 'auto',
      minHeight: '100vh',
    },
  },
  column: {
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  startOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalL,
    zIndex: 100,
    backdropFilter: 'blur(2px)',
  },
  overlayCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalXXL,
    borderRadius: tokens.borderRadiusXLarge,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    boxShadow: tokens.shadow28,
    maxWidth: '480px',
    textAlign: 'center',
  },
  resetBar: {
    position: 'absolute',
    top: tokens.spacingVerticalM,
    right: tokens.spacingHorizontalL,
    zIndex: 50,
  },
})

interface Props {
  scenario?: Scenario
}

export function DispatcherWorkspace({ scenario }: Props) {
  const styles = useStyles()
  const active = scenario ?? DEMO_SCENARIOS[0]

  const {
    phase,
    messages,
    typing,
    form,
    autoFilledFields,
    recentlyChangedFields,
    unknownNumber,
    incomingPhone,
    priorIncidentsCount,
    dispatchSummary,
    summaryLoading,
    updateFormField,
    start,
    reset,
  } = useDemoCall({
    scenario: active,
  })

  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [dispatched, setDispatched] = useState(false)
  const [pendingDispatch, setPendingDispatch] =
    useState<DispatchSummary | null>(null)

  const toasterId = useId('dispatcher-toaster')
  const { dispatchToast } = useToastController(toasterId)

  const handleReset = () => {
    setDispatchOpen(false)
    setDispatched(false)
    setPendingDispatch(null)
    reset()
  }

  const handleSubmitForm = () => {
    dispatchToast(
      <Toast>
        <ToastTitle>Form submitted to CAD (demo)</ToastTitle>
      </Toast>,
      { intent: 'success' }
    )
  }

  const handleDispatchClick = (final: DispatchSummary) => {
    setPendingDispatch(final)
    setDispatchOpen(true)
  }

  const callerName =
    form.who.caller_name || active.demo_form?.who.caller_name

  return (
    <div className={styles.workspace}>
      <div className={styles.column}>
        <InfoPanel
          form={form}
          autoFilledFields={autoFilledFields}
          recentlyChangedFields={recentlyChangedFields}
          unknownNumber={unknownNumber}
          incomingPhone={incomingPhone}
          priorIncidentsCount={priorIncidentsCount}
          onFieldChange={updateFormField}
          onSubmit={handleSubmitForm}
        />
      </div>
      <div className={styles.column}>
        <TranscriptPanel
          messages={messages}
          phase={phase}
          callerName={callerName}
          typing={typing}
        />
      </div>
      <div className={styles.column}>
        <RightSplitPanel
          top={
            <KnowledgeChatPanel
              messages={active.demo_knowledge_messages ?? []}
              suggestions={active.demo_knowledge_suggestions}
              qa={active.demo_knowledge_qa}
              resetKey={active.id}
            />
          }
          bottom={
            <DispatchSummaryPanel
              summary={dispatchSummary}
              loading={summaryLoading}
              dispatched={dispatched}
              onDispatch={handleDispatchClick}
            />
          }
        />
      </div>

      <Dialog
        open={dispatchOpen}
        onOpenChange={(_, data) => setDispatchOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm dispatch</DialogTitle>
            <DialogContent>
              <Text>
                Send the following units to{' '}
                <strong>{pendingDispatch?.location[0] ?? 'the incident'}</strong>?
              </Text>
              <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                {(pendingDispatch?.units ?? []).map((u, i) => (
                  <li key={i}>
                    <Text>{u}</Text>
                  </li>
                ))}
              </ul>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                icon={<CheckmarkCircleFilled />}
                onClick={() => {
                  setDispatched(true)
                  setDispatchOpen(false)
                  dispatchToast(
                    <Toast>
                      <ToastTitle>
                        Dispatch confirmed — units en route
                      </ToastTitle>
                    </Toast>,
                    { intent: 'success' }
                  )
                }}
              >
                Confirm dispatch
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Toaster toasterId={toasterId} position="bottom" />

      {phase !== 'idle' && (
        <div className={styles.resetBar}>
          <Button
            appearance="subtle"
            icon={<ArrowResetRegular />}
            onClick={handleReset}
          >
            Reset call
          </Button>
        </div>
      )}

      {phase === 'idle' && (
        <div className={styles.startOverlay}>
          <div className={styles.overlayCard}>
            <Text size={600} weight="semibold">
              {active.name}
            </Text>
            <Text size={300}>{active.description}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Incoming caller-ID: {active.caller_id ?? 'Unknown'}
            </Text>
            <Button
              appearance="primary"
              size="large"
              icon={<CallRegular />}
              onClick={start}
            >
              Start demo call
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
