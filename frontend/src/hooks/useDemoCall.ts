/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useEffect, useRef, useState } from 'react'
import { lookupCaller } from '../data/callerDirectory'
import { DispatchSummary, EmergencyCaseForm, FormUpdate, Message, Scenario } from '../types'
import { applyCallerIdentity, applyFormPatch, buildEmptyForm } from '../utils/formHelpers'

export type CallPhase = 'idle' | 'ringing' | 'active' | 'ended'

interface UseDemoCallOptions {
  scenario: Scenario
  /** Delay (ms) between caller-side answers and the next operator turn. */
  defaultTurnDelayMs?: number
  /** Time the "Ringing" phase is shown before the first turn. */
  ringingDurationMs?: number
  /** How long the typing indicator shows before each non-first turn. */
  typingDurationMs?: number
  /** How long a recently-changed field stays highlighted (ms). */
  highlightDurationMs?: number
  /** Delay (ms) between phase=ended and dispatch summary appearing. */
  summaryGenerateMs?: number
}

interface UseDemoCallResult {
  phase: CallPhase
  messages: Message[]
  /** True while a typing indicator should appear at the bottom of the transcript. */
  typing: boolean
  /** Index of the most recently appended turn (-1 if none yet). */
  lastTurnIndex: number
  /** Live form state (starts empty, gets patched during the call). */
  form: EmergencyCaseForm
  /** Dotted-path keys of fields that were populated by caller-ID lookup. */
  autoFilledFields: Set<string>
  /** Dotted-path keys of fields whose value just changed (for highlight animation). */
  recentlyChangedFields: Set<string>
  /** True when the incoming caller_id is not in the directory. */
  unknownNumber: boolean
  /** Best-effort phone (from directory or scenario.caller_id). */
  incomingPhone: string
  /** Prior-incidents count for the matched caller (0 when unknown). */
  priorIncidentsCount: number
  /** Post-call dispatch summary (null while still being generated). */
  dispatchSummary: DispatchSummary | null
  /** True between phase=ended and dispatchSummary being committed. */
  summaryLoading: boolean
  /**
   * Update a single field in the live form. `path` is a two-segment dotted
   * key like "who.caller_name" or "how_many.people_affected".
   */
  updateFormField: (path: string, value: string | number) => void
  start: () => void
  reset: () => void
}

/**
 * Scripted demo-call state machine. Handles:
 *  - Phase transitions (idle → ringing → active → ended)
 *  - Transcript playback with typing indicator and "Call connected/ended" events
 *  - Caller-ID auto-fill on ring-to-active transition
 *  - Field-change highlight tracking for the InfoPanel
 */
export function useDemoCall({
  scenario,
  defaultTurnDelayMs = 2200,
  ringingDurationMs = 1200,
  typingDurationMs = 900,
  highlightDurationMs = 1200,
  summaryGenerateMs = 1500,
}: UseDemoCallOptions): UseDemoCallResult {
  const [phase, setPhase] = useState<CallPhase>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [typing, setTyping] = useState(false)
  const [lastTurnIndex, setLastTurnIndex] = useState(-1)
  const [form, setForm] = useState<EmergencyCaseForm>(buildEmptyForm())
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(
    new Set()
  )
  const [recentlyChangedFields, setRecentlyChangedFields] = useState<
    Set<string>
  >(new Set())
  const [unknownNumber, setUnknownNumber] = useState(false)
  const [incomingPhone, setIncomingPhone] = useState('')
  const [priorIncidentsCount, setPriorIncidentsCount] = useState(0)
  const [dispatchSummary, setDispatchSummary] =
    useState<DispatchSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const turnSeqRef = useRef(0)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
  }, [])

  const schedule = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay)
    timersRef.current.push(t)
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    turnSeqRef.current = 0
    setPhase('idle')
    setMessages([])
    setTyping(false)
    setLastTurnIndex(-1)
    setForm(buildEmptyForm())
    setAutoFilledFields(new Set())
    setRecentlyChangedFields(new Set())
    setUnknownNumber(false)
    setIncomingPhone('')
    setPriorIncidentsCount(0)
    setDispatchSummary(null)
    setSummaryLoading(false)
  }, [clearTimers])

  const appendMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg])
  }, [])

  /** Mark fields as recently changed; auto-clear after highlightDurationMs. */
  const markChanged = useCallback(
    (keys: string[]) => {
      if (keys.length === 0) return
      setRecentlyChangedFields(prev => {
        const next = new Set(prev)
        keys.forEach(k => next.add(k))
        return next
      })
      schedule(() => {
        setRecentlyChangedFields(prev => {
          const next = new Set(prev)
          keys.forEach(k => next.delete(k))
          return next
        })
      }, highlightDurationMs)
    },
    [schedule, highlightDurationMs]
  )

  const start = useCallback(() => {
    if (phase !== 'idle') return
    const transcript = scenario.demo_transcript ?? []
    if (transcript.length === 0) return

    setPhase('ringing')

    // After ringing, do caller-ID lookup, emit system event, start playback
    schedule(() => {
      setPhase('active')

      // ── Caller-ID auto-fill ────────────────────────────────────────────
      const identity = lookupCaller(scenario.caller_id)
      if (identity) {
        setForm(prev => {
          const { form: patched, filledKeys } = applyCallerIdentity(
            prev,
            identity
          )
          setAutoFilledFields(new Set(filledKeys))
          markChanged(filledKeys)
          return patched
        })
        setIncomingPhone(identity.caller_phone)
        setUnknownNumber(false)
        setPriorIncidentsCount(identity.prior_incidents_count)
      } else {
        // Unknown number — only the raw incoming phone is shown
        const phone = scenario.caller_id ?? ''
        setIncomingPhone(phone)
        setUnknownNumber(true)
        if (phone) {
          setForm(prev => ({
            ...prev,
            who: { ...prev.who, caller_phone: phone },
          }))
        }
      }

      appendMessage({
        id: `${scenario.id}-sys-connect-${turnSeqRef.current++}`,
        role: 'system',
        content: identity
          ? `Call connected — Caller-ID matched: ${identity.caller_name}`
          : 'Call connected — Caller-ID unknown',
        timestamp: new Date(),
      })

      // ── Schedule transcript turns ──────────────────────────────────────
      const updates: FormUpdate[] = scenario.demo_form_updates ?? []
      let cursor = 200
      transcript.forEach((turn, idx) => {
        const showTypingAt = cursor
        const appendAt = cursor + (idx === 0 ? 400 : typingDurationMs)

        if (idx > 0) {
          schedule(() => setTyping(true), showTypingAt)
        }

        schedule(() => {
          setTyping(false)
          appendMessage({
            id: `${scenario.id}-turn-${idx}`,
            role: turn.role,
            content: turn.content,
            timestamp: new Date(),
          })
          setLastTurnIndex(idx)

          // Apply any form_updates that fire after this turn
          const matching = updates.filter(u => u.after_turn_index === idx)
          matching.forEach(update => {
            setForm(prev => applyFormPatch(prev, update.patch))
            markChanged(update.fields)
          })
        }, appendAt)

        cursor = appendAt + defaultTurnDelayMs
      })

      schedule(() => {
        appendMessage({
          id: `${scenario.id}-sys-end-${turnSeqRef.current++}`,
          role: 'system',
          content: 'Call ended',
          timestamp: new Date(),
        })
        setPhase('ended')
        setSummaryLoading(true)
        // Generate dispatch summary after a short "AI thinking" delay
        schedule(() => {
          setDispatchSummary(scenario.demo_dispatch_summary ?? null)
          setSummaryLoading(false)
        }, summaryGenerateMs)
      }, cursor)
    }, ringingDurationMs)
  }, [
    phase,
    scenario,
    appendMessage,
    schedule,
    markChanged,
    ringingDurationMs,
    typingDurationMs,
    defaultTurnDelayMs,
    summaryGenerateMs,
  ])

  // Reset and clean up if scenario changes or component unmounts
  useEffect(() => {
    reset()
    return () => clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id])

  useEffect(() => () => clearTimers(), [clearTimers])

  /** Operator manual edit — clears auto-fill caption for that field. */
  const updateFormField = useCallback(
    (path: string, value: string | number) => {
      const [section, key] = path.split('.') as [
        keyof EmergencyCaseForm,
        string,
      ]
      if (!section || !key) return
      setForm(prev => {
        const sectionObj = prev[section] as Record<string, unknown>
        return {
          ...prev,
          [section]: { ...sectionObj, [key]: value },
        }
      })
      setAutoFilledFields(prev => {
        if (!prev.has(path)) return prev
        const next = new Set(prev)
        next.delete(path)
        return next
      })
    },
    []
  )

  return {
    phase,
    messages,
    typing,
    lastTurnIndex,
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
  }
}
