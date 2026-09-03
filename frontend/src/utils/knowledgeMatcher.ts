/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnowledgeQAEntry } from '../types';

/**
 * Picks the QA entry with the highest keyword hit count against `question`.
 * Case-insensitive substring match. Returns null when no keyword hits.
 */
export function matchKnowledge(
  question: string,
  pool: KnowledgeQAEntry[]
): KnowledgeQAEntry | null {
  const q = question.toLowerCase()
  let best: { entry: KnowledgeQAEntry; score: number } | null = null
  for (const entry of pool) {
    let score = 0
    for (const kw of entry.keywords) {
      if (kw && q.includes(kw.toLowerCase())) score += 1
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score }
    }
  }
  return best?.entry ?? null
}

export const FALLBACK_ANSWER =
  'No SOP entry matched. Please consult the printed manual or escalate to a senior dispatcher.'
