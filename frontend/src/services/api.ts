/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CaseResult, Scenario } from '../types'

export const api = {
  async getConfig() {
    const res = await fetch('/api/config')
    return res.json()
  },

  async getScenarios(): Promise<Scenario[]> {
    const res = await fetch('/api/scenarios')
    return res.json()
  },

  async createAgent(scenarioId: string) {
    const res = await fetch('/api/agents/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
    })
    if (!res.ok) throw new Error('Failed to create agent')
    return res.json()
  },

  async analyzeConversation(
    scenarioId: string,
    transcript: string
  ): Promise<CaseResult> {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenarioId,
        transcript,
      }),
    })
    if (!res.ok) throw new Error('Analysis failed')
    return res.json()
  },
}
