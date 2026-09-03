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
import { ArrowResetRegular, PlayRegular } from '@fluentui/react-icons'
import { useMemo, useRef, useState } from 'react'
import { useVideoDemo } from '../hooks/useVideoDemo'
import { DispatchSummary, VideoDispatchSummary, VideoScenario } from '../types'
import { AiTriggerBanner } from './AiTriggerBanner'
import { DispatchSummaryPanel } from './DispatchSummaryPanel'
import { IncidentDetailDrawer } from './IncidentDetailDrawer'
import { IncidentQueuePanel } from './IncidentQueuePanel'
import { PrimaryFeedPanel } from './PrimaryFeedPanel'
import { RelatedFeedsGrid } from './RelatedFeedsGrid'

const useStyles = makeStyles({
  workspace: {
    width: '100%',
    height: '100vh',
    display: 'grid',
    gridTemplateColumns: '65fr 35fr',
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
  leftCol: {
    display: 'grid',
    gridTemplateRows: 'auto 60fr 40fr',
    gap: tokens.spacingVerticalM,
    minWidth: 0,
    minHeight: 0,
  },
  rightCol: {
    position: 'relative',
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  rightColInner: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },
  incidentWrapper: {
    flexShrink: 0,
    maxHeight: '40%',
    minHeight: '200px',
    overflow: 'hidden',
  },
  startOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  triggerMetaStrip: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
    flexShrink: 0,
  },
  triggerMetaStrong: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  dispatchAttention: {
    boxShadow: `0 0 0 3px ${tokens.colorBrandStroke1}`,
    transition: 'box-shadow 0.3s',
  },
})

interface Props {
  scenario: VideoScenario
}

/** Map the manifest's video-summary shape onto the existing DispatchSummary
 *  shape so DispatchSummaryPanel + useEditableDispatchSummary work unmodified. */
function toDispatchSummary(v: VideoDispatchSummary | null): DispatchSummary | null {
  if (!v) return null
  return {
    emergency_type:
      v.recommended_tab === 'FIRE'
        ? 'fire'
        : v.recommended_tab === 'MEDICAL'
          ? 'medical'
          : 'crime',
    recommended_tab: v.recommended_tab,
    location: v.sections.location,
    nature: v.sections.nature_of_emergency,
    video_observations: v.sections.video_observations,
    people: v.sections.people_affected,
    interpretations: v.sections.interpretations,
    hazards: v.sections.hazards,
    units: v.sections.recommended_units,
    notes: v.sections.operator_notes,
  }
}

export function VideoFeedWorkspace({ scenario }: Props) {
  const styles = useStyles()
  const {
    phase,
    trigger,
    triggerStatus,
    primary,
    related,
    relatedReady,
    incidents,
    incidentsReady,
    summary,
    summaryLoading,
    selectedIncident,
    promote,
    selectIncident,
    acknowledgeTrigger,
    dismissTrigger,
    requestMoreEvidence,
    markDispatched,
    start,
    reset,
  } = useVideoDemo({ scenario })

  const showStartOverlay = phase === 'idle'
  const primaryLive =
    phase !== 'idle' && phase !== 'connecting' && phase !== 'trigger-raised'

  const aiDraft = useMemo(() => toDispatchSummary(summary), [summary])

  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [dispatched, setDispatched] = useState(false)
  const [pendingDispatch, setPendingDispatch] = useState<DispatchSummary | null>(
    null
  )
  const [dispatchAttention, setDispatchAttention] = useState(false)

  const summaryRef = useRef<HTMLDivElement | null>(null)

  const toasterId = useId('video-toaster')
  const { dispatchToast } = useToastController(toasterId)

  const handleDispatchClick = (final: DispatchSummary) => {
    setPendingDispatch(final)
    setDispatchOpen(true)
  }

  const handleConfirmDispatch = () => {
    setDispatched(true)
    setDispatchOpen(false)
    markDispatched()
    dispatchToast(
      <Toast>
        <ToastTitle>Dispatched (demo)</ToastTitle>
      </Toast>,
      { intent: 'success' }
    )
  }

  const handleAcknowledge = () => {
    acknowledgeTrigger()
    // Move focus to V8 dispatch summary + briefly highlight V9 dispatch button
    summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setDispatchAttention(true)
    window.setTimeout(() => setDispatchAttention(false), 1600)
  }

  const handleReset = () => {
    setDispatchOpen(false)
    setDispatched(false)
    setPendingDispatch(null)
    setDispatchAttention(false)
    reset()
  }

  return (
    <div className={styles.workspace}>
      {!showStartOverlay && (
        <div className={styles.resetBar}>
          <Button
            appearance="secondary"
            icon={<ArrowResetRegular />}
            onClick={handleReset}
            size="small"
          >
            Reset demo
          </Button>
        </div>
      )}

      {/* LEFT COLUMN — V0 trigger banner (top), V1/V2/V3 (middle), V4/V5 (bottom full-width) */}
      <div className={styles.leftCol}>
        {!showStartOverlay && (
          <AiTriggerBanner
            trigger={trigger}
            status={triggerStatus}
            onAcknowledge={handleAcknowledge}
            onDismiss={dismissTrigger}
            onRequestMoreEvidence={requestMoreEvidence}
          />
        )}
        <PrimaryFeedPanel feed={primary} scenarioId={scenario.id} live={primaryLive} />
        <RelatedFeedsGrid
          feeds={related}
          scenarioId={scenario.id}
          ready={relatedReady}
          onPromote={promote}
          trigger={trigger}
        />
      </div>

      {/* RIGHT COLUMN — incidents queue + dispatch summary + drawer overlay */}
      <div className={styles.rightCol}>
        <div className={styles.incidentWrapper}>
          <IncidentQueuePanel
            incidents={incidents}
            ready={incidentsReady}
            selectedCadId={selectedIncident?.cad_id ?? null}
            onSelect={cadId => selectIncident(cadId)}
          />
        </div>
        <div
          ref={summaryRef}
          className={`${styles.rightColInner} ${dispatchAttention ? styles.dispatchAttention : ''}`}
        >
          {trigger && summary && (
            <div className={styles.triggerMetaStrip}>
              <Text size={100}>
                Drafted from{' '}
                <span className={styles.triggerMetaStrong}>{trigger.cad_id}</span>{' '}
                · AI-triggered ·{' '}
                <span className={styles.triggerMetaStrong}>{trigger.priority}</span>{' '}
                ·{' '}
                <span className={styles.triggerMetaStrong}>
                  {trigger.evidence.length}
                </span>{' '}
                corroborating sources
              </Text>
            </div>
          )}
          <DispatchSummaryPanel
            summary={aiDraft}
            loading={summaryLoading}
            dispatched={dispatched}
            onDispatch={handleDispatchClick}
          />
        </div>
        <IncidentDetailDrawer
          incident={selectedIncident}
          onClose={() => selectIncident(null)}
        />
      </div>

      {/* Start overlay for step 0 */}
      {showStartOverlay && (
        <div className={styles.startOverlay}>
          <div className={styles.overlayCard}>
            <Text size={500} weight="semibold">
              {scenario.title}
            </Text>
            <Text size={200}>
              CCTV alerting agent has flagged a primary feed and correlated three
              nearby cameras. Click below to enter the Video Analytics workspace.
            </Text>
            <Button
              appearance="primary"
              icon={<PlayRegular />}
              size="large"
              onClick={start}
            >
              Start demo
            </Button>
          </div>
        </div>
      )}

      {/* Dispatch confirmation — never overlays the primary feed (centered modal) */}
      <Dialog
        open={dispatchOpen}
        onOpenChange={(_, data) => setDispatchOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm dispatch</DialogTitle>
            <DialogContent>
              <Text>The following recommended units will be dispatched:</Text>
              <ul>
                {pendingDispatch?.units.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleConfirmDispatch}>
                Confirm dispatch
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Toaster toasterId={toasterId} />
    </div>
  )
}
