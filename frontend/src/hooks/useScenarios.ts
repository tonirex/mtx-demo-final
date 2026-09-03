/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from 'react'
import { DEMO_SCENARIOS } from '../data/demoScenarios'
import { VIDEO_SCENARIOS } from '../data/videoScenarios'
import { api } from '../services/api'
import { Scenario } from '../types'

const isDemoShell = () =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('demo') === '1'

/** Project the VideoScenario fixtures into Scenario cards for the picker. */
const videoScenariosAsCards: Scenario[] = VIDEO_SCENARIOS.map(v => ({
  id: v.id,
  name: v.title,
  description: `Video Analytics demo — ${v.related_feeds.length} correlated feeds, ${v.related_incidents.length} related incidents.`,
  is_demo: v.is_demo,
  kind: 'video',
  video: v,
}))

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>(
    isDemoShell()
      ? [...DEMO_SCENARIOS, ...videoScenariosAsCards]
      : []
  )
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isDemoShell())

  useEffect(() => {
    if (isDemoShell()) return
    api
      .getScenarios()
      .then(apiScenarios => {
        // Merge: backend scenarios first, then frontend demo + video scenarios.
        setScenarios([
          ...apiScenarios,
          ...DEMO_SCENARIOS,
          ...videoScenariosAsCards,
        ])
      })
      .catch(() => {
        // Backend unavailable — fall back to frontend-only fixtures.
        setScenarios([...DEMO_SCENARIOS, ...videoScenariosAsCards])
      })
      .finally(() => setLoading(false))
  }, [])

  return {
    scenarios,
    selectedScenario,
    setSelectedScenario,
    loading,
  }
}
