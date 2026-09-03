/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    AiTrigger,
    AiTriggerStatus,
    CameraFeed,
    RelatedIncident,
    VideoDispatchSummary,
    VideoScenario,
} from '../types'

export type VideoPhase =
  | 'idle' // before Start
  | 'connecting' // step 0 — workspace mounted, V1 still placeholder
  | 'trigger-raised' // step 0.5 — V0 banner populated, V1 still connecting
  | 'primary-live' // step 1 — V1 playing, V2 banner + V3 overlay visible
  | 'related-live' // step 2 — V4 populated
  | 'queue-live' // step 3 — V6 populated
  | 'summary-generating' // step 4a — AI generating chip
  | 'ready' // step 4b — V8 populated, full demo state

interface UseVideoDemoOptions {
  scenario: VideoScenario
  /** Defaults align with VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §4. */
  triggerRaisedMs?: number
  primaryConnectMs?: number
  relatedAppearMs?: number
  queueAppearMs?: number
  summaryStartMs?: number
  summaryGenerateMs?: number
}

interface UseVideoDemoResult {
  phase: VideoPhase
  /** AI trigger banner data (V0). `null` until phase reaches 'trigger-raised'. */
  trigger: AiTrigger | null
  triggerStatus: AiTriggerStatus
  /** Camera currently shown in V1. */
  primary: CameraFeed
  /** Cameras currently shown in V4 (always 3 entries). */
  related: CameraFeed[]
  relatedReady: boolean
  incidents: RelatedIncident[]
  incidentsReady: boolean
  summary: VideoDispatchSummary | null
  summaryLoading: boolean
  selectedIncident: RelatedIncident | null
  /** Promote a related feed to the primary slot; previous primary swaps in. */
  promote: (cameraId: string) => void
  selectIncident: (cadId: string | null) => void
  /** V0: operator validates the AI trigger. Status → 'acknowledged'. */
  acknowledgeTrigger: () => void
  /** V0: operator dismisses the trigger as a false positive. Resets workspace to step 0. */
  dismissTrigger: () => void
  /** V0: stub no-op for narration. */
  requestMoreEvidence: () => void
  /** Called by the workspace when dispatch is confirmed. Status pill → 'dispatched'. */
  markDispatched: () => void
  start: () => void
  reset: () => void
}

const DEFAULTS = {
  triggerRaisedMs: 500,
  primaryConnectMs: 1000,
  relatedAppearMs: 2000,
  queueAppearMs: 2500,
  summaryStartMs: 3000,
  summaryGenerateMs: 1500,
}

/**
 * Orchestrates the scripted Video Analytics demo flow per
 * docs/VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §4.
 */
export function useVideoDemo(opts: UseVideoDemoOptions): UseVideoDemoResult {
  const cfg = { ...DEFAULTS, ...opts }
  const { scenario } = cfg

  const [phase, setPhase] = useState<VideoPhase>('idle')
  const [primary, setPrimary] = useState<CameraFeed>(scenario.primary_feed)
  const [related, setRelated] = useState<CameraFeed[]>(scenario.related_feeds)
  const [summary, setSummary] = useState<VideoDispatchSummary | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<RelatedIncident | null>(null)
  const [trigger, setTrigger] = useState<AiTrigger | null>(null)
  const [triggerStatus, setTriggerStatus] = useState<AiTriggerStatus>(
    scenario.ai_trigger.status
  )

  /** Ref-held timers so they survive phase-state changes without being cleared. */
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(t => window.clearTimeout(t))
    timersRef.current = []
  }, [])

  // Clean up on unmount
  useEffect(() => clearTimers, [clearTimers])

  const start = useCallback(() => {
    setPhase('connecting')
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    setPhase('idle')
    setPrimary(scenario.primary_feed)
    setRelated(scenario.related_feeds)
    setSummary(null)
    setSelectedIncident(null)
    setTrigger(null)
    setTriggerStatus(scenario.ai_trigger.status)
  }, [scenario, clearTimers])

  // ── Scripted timeline ──────────────────────────────────────────────────
  // When phase enters 'connecting', schedule all transitions at absolute
  // offsets. Timers are stored in a ref so React's effect cleanup on
  // subsequent phase changes does NOT cancel them.
  useEffect(() => {
    if (phase !== 'connecting') return

    // Clear any leftover timers from a prior connecting cycle
    clearTimers()

    timersRef.current.push(
      window.setTimeout(() => {
        setTrigger(scenario.ai_trigger)
        setTriggerStatus(scenario.ai_trigger.status)
        setPhase('trigger-raised')
      }, cfg.triggerRaisedMs)
    )
    timersRef.current.push(
      window.setTimeout(() => setPhase('primary-live'), cfg.primaryConnectMs)
    )
    timersRef.current.push(
      window.setTimeout(
        () => setPhase('related-live'),
        cfg.primaryConnectMs + cfg.relatedAppearMs
      )
    )
    timersRef.current.push(
      window.setTimeout(
        () => setPhase('queue-live'),
        cfg.primaryConnectMs + cfg.queueAppearMs
      )
    )
    timersRef.current.push(
      window.setTimeout(
        () => setPhase('summary-generating'),
        cfg.primaryConnectMs + cfg.summaryStartMs
      )
    )
    timersRef.current.push(
      window.setTimeout(() => {
        setSummary(scenario.dispatch_summary)
        setPhase('ready')
      }, cfg.primaryConnectMs + cfg.summaryStartMs + cfg.summaryGenerateMs)
    )
    // Intentionally NO cleanup return — timers must survive across
    // phase changes. They are cleared by reset() or unmount instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, scenario, cfg.triggerRaisedMs, cfg.primaryConnectMs, cfg.relatedAppearMs, cfg.queueAppearMs, cfg.summaryStartMs, cfg.summaryGenerateMs, clearTimers])

  const promote = useCallback(
    (cameraId: string) => {
      const idx = related.findIndex(r => r.camera_id === cameraId)
      if (idx < 0) return
      const newPrimary = related[idx]
      const newRelated = related.slice()
      // The previously primary feed lands in the same slot the promoted tile
      // came from. Drops ai_overlay since overlay is keyed to the primary.
      newRelated[idx] = primary
      setPrimary(newPrimary)
      setRelated(newRelated)
    },
    [primary, related]
  )

  const selectIncident = useCallback(
    (cadId: string | null) => {
      if (cadId == null) {
        setSelectedIncident(null)
        return
      }
      const found = scenario.related_incidents.find(i => i.cad_id === cadId) ?? null
      setSelectedIncident(found)
    },
    [scenario.related_incidents]
  )

  const acknowledgeTrigger = useCallback(() => {
    setTriggerStatus(prev =>
      prev === 'awaiting-validation' ? 'acknowledged' : prev
    )
  }, [])

  const dismissTrigger = useCallback(() => {
    setTriggerStatus('dismissed')
    // Returning to step-0 visual state per spec §5.0
    clearTimers()
    setPhase('idle')
    setPrimary(scenario.primary_feed)
    setRelated(scenario.related_feeds)
    setSummary(null)
    setSelectedIncident(null)
    setTrigger(null)
  }, [scenario, clearTimers])

  const requestMoreEvidence = useCallback(() => {
    // Stub no-op for narration; spec §5.0.
  }, [])

  const markDispatched = useCallback(() => {
    setTriggerStatus('dispatched')
  }, [])

  const relatedReady = useMemo(
    () => phase === 'related-live' || phase === 'queue-live' || phase === 'summary-generating' || phase === 'ready',
    [phase]
  )
  const incidentsReady = useMemo(
    () => phase === 'queue-live' || phase === 'summary-generating' || phase === 'ready',
    [phase]
  )
  const summaryLoading = phase === 'summary-generating'

  return {
    phase,
    trigger,
    triggerStatus,
    primary,
    related,
    relatedReady,
    incidents: scenario.related_incidents,
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
  }
}
