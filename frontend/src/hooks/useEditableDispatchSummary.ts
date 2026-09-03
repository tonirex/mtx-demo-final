/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DispatchSummary } from '../types'

/** Sections of the dispatch summary that are editable as bullet lists. */
export type SectionKey =
  | 'location'
  | 'nature'
  | 'video_observations'
  | 'people'
  | 'interpretations'
  | 'hazards'
  | 'units'
  | 'notes'

export const SECTION_LABELS: Record<SectionKey, string> = {
  location: 'Location (from camera metadata)',
  nature: 'Nature of emergency',
  video_observations: 'AI video observations',
  people: 'People affected',
  interpretations: 'Possible AI interpretations',
  hazards: 'Hazards & risk assessment',
  units: 'Recommended units',
  notes: 'Operator notes',
}

/** Sections that must be non-empty for Save to be allowed. */
export const REQUIRED_SECTIONS: SectionKey[] = ['location', 'nature', 'units']

/**
 * Manages an operator-editable overlay on top of an AI-generated dispatch
 * summary. Tracks which bullets the operator changed, added, or removed in
 * the current session so the panel can render an "edited" affordance and a
 * per-row Revert action. A panel-level Revert restores the entire summary.
 */
export function useEditableDispatchSummary(aiDraft: DispatchSummary | null) {
  const [draft, setDraft] = useState<DispatchSummary | null>(aiDraft)
  const [editing, setEditing] = useState(false)
  const [tabOverride, setTabOverride] = useState<
    DispatchSummary['recommended_tab'] | null
  >(null)
  const [lastEditedAt, setLastEditedAt] = useState<Date | null>(null)
  // Working copy used while editing — committed to draft on Save.
  const [working, setWorking] = useState<DispatchSummary | null>(null)

  // Whenever the AI draft changes (e.g. new scenario), reset everything.
  useEffect(() => {
    setDraft(aiDraft)
    setEditing(false)
    setTabOverride(null)
    setLastEditedAt(null)
    setWorking(null)
  }, [aiDraft])

  const enterEdit = useCallback(() => {
    if (!draft) return
    setWorking(JSON.parse(JSON.stringify(draft)))
    setEditing(true)
  }, [draft])

  const cancelEdit = useCallback(() => {
    setWorking(null)
    setEditing(false)
  }, [])

  const saveEdit = useCallback(() => {
    if (!working) return
    // Strip empty bullets per spec
    const cleaned: DispatchSummary = {
      ...working,
      location: working.location.filter(s => s.trim()),
      nature: working.nature.filter(s => s.trim()),
      video_observations: working.video_observations.filter(s => s.trim()),
      people: working.people.filter(s => s.trim()),
      interpretations: working.interpretations.filter(s => s.trim()),
      hazards: working.hazards.filter(s => s.trim()),
      units: working.units.filter(s => s.trim()),
      notes: working.notes.filter(s => s.trim()),
    }
    setDraft(cleaned)
    setLastEditedAt(new Date())
    setEditing(false)
    setWorking(null)
  }, [working])

  const revertAll = useCallback(() => {
    setDraft(aiDraft)
    setTabOverride(null)
    setLastEditedAt(null)
    if (editing && aiDraft) {
      setWorking(JSON.parse(JSON.stringify(aiDraft)))
    }
  }, [aiDraft, editing])

  /** Mutate one bullet inside the working copy. */
  const updateBullet = useCallback(
    (section: SectionKey, idx: number, value: string) => {
      setWorking(prev => {
        if (!prev) return prev
        const arr = [...prev[section]]
        arr[idx] = value
        return { ...prev, [section]: arr }
      })
    },
    []
  )

  const addBullet = useCallback((section: SectionKey) => {
    setWorking(prev => {
      if (!prev) return prev
      return { ...prev, [section]: [...prev[section], ''] }
    })
  }, [])

  const removeBullet = useCallback((section: SectionKey, idx: number) => {
    setWorking(prev => {
      if (!prev) return prev
      const arr = prev[section].filter((_, i) => i !== idx)
      return { ...prev, [section]: arr }
    })
  }, [])

  const moveBullet = useCallback(
    (section: SectionKey, idx: number, dir: -1 | 1) => {
      setWorking(prev => {
        if (!prev) return prev
        const arr = [...prev[section]]
        const target = idx + dir
        if (target < 0 || target >= arr.length) return prev
        ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
        return { ...prev, [section]: arr }
      })
    },
    []
  )

  /** Revert a single bullet to the matching index in the AI draft. */
  const revertBullet = useCallback(
    (section: SectionKey, idx: number) => {
      if (!aiDraft) return
      const original = aiDraft[section][idx]
      if (original === undefined) {
        // Bullet didn't exist in AI draft → remove it
        setWorking(prev => {
          if (!prev) return prev
          return {
            ...prev,
            [section]: prev[section].filter((_, i) => i !== idx),
          }
        })
        return
      }
      updateBullet(section, idx, original)
    },
    [aiDraft, updateBullet]
  )

  const setTab = useCallback(
    (next: DispatchSummary['recommended_tab']) => {
      if (!aiDraft) return
      setTabOverride(next === aiDraft.recommended_tab ? null : next)
    },
    [aiDraft]
  )

  /** Identify which bullets in the *committed* draft differ from AI. */
  const editedKeys = useMemo(() => {
    const keys = new Set<string>()
    if (!aiDraft || !draft) return keys
    ;(Object.keys(SECTION_LABELS) as SectionKey[]).forEach(section => {
      const a = aiDraft[section]
      const b = draft[section]
      const max = Math.max(a.length, b.length)
      for (let i = 0; i < max; i++) {
        if (a[i] !== b[i]) keys.add(`${section}.${i}`)
      }
    })
    return keys
  }, [aiDraft, draft])

  /** Validation: at least one non-empty bullet in each required section. */
  const validation = useMemo(() => {
    const source = working ?? draft
    if (!source) return { valid: false, missing: REQUIRED_SECTIONS }
    const missing = REQUIRED_SECTIONS.filter(
      s => source[s].filter(b => b.trim()).length === 0
    )
    return { valid: missing.length === 0, missing }
  }, [working, draft])

  /** Active tab to display: override if set, else AI recommendation. */
  const activeTab =
    tabOverride ?? draft?.recommended_tab ?? aiDraft?.recommended_tab ?? 'FIRE'
  const tabIsOverridden = tabOverride !== null

  // `draft` is synced from `aiDraft` via useEffect, so on the first render
  // after a new aiDraft arrives `draft` is still the old value (or null).
  // Fall back to `aiDraft` to avoid a one-render gap that would crash any
  // consumer doing `summary[section].map(...)`.
  const displayedDraft = draft ?? aiDraft

  return {
    /** Currently displayed summary (working copy while editing, else committed draft). */
    summary: editing ? working : displayedDraft,
    /** The pristine AI draft — used for diff display + revert. */
    aiDraft,
    /** Operator-edited summary that should be sent to dispatch. */
    finalSummary: displayedDraft,
    editing,
    enterEdit,
    cancelEdit,
    saveEdit,
    revertAll,
    updateBullet,
    addBullet,
    removeBullet,
    moveBullet,
    revertBullet,
    activeTab,
    setTab,
    tabIsOverridden,
    editedKeys,
    validation,
    lastEditedAt,
  }
}
