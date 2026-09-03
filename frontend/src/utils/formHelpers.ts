/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CallerIdentity, DeepPartialForm, EmergencyCaseForm } from '../types';

/**
 * Returns a fully-shaped EmergencyCaseForm with empty values, used as the
 * starting state in demo mode before any caller-ID auto-fill or transcript
 * patches are applied.
 */
export function buildEmptyForm(): EmergencyCaseForm {
  return {
    where: {
      address: '',
      floor_level: '',
      landmarks: '',
      access_notes: '',
      confidence: 'low',
    },
    what: {
      emergency_type: 'other',
      description: '',
      severity_estimate: 'minor',
    },
    who: {
      caller_name: '',
      caller_phone: '',
      relationship_to_emergency: '',
    },
    how_many: {
      people_affected: 0,
      casualties_count: 0,
      casualties_condition: [],
    },
    triage: {
      priority: 'P3_standard',
      dispatch_services: [],
      rationale: '',
      escalation_flags: [],
      response_category: 'scheduled',
    },
    additional_info: {
      hazards: '',
      caller_emotional_state: '',
    },
    case_summary: '',
    completeness_score: {
      where: false,
      what: false,
      who: false,
      how_many: false,
      overall_pct: 0,
    },
  }
}

/**
 * Merges a CallerIdentity into the form. Returns the updated form and the
 * dotted-path keys of fields that were populated from the directory.
 */
export function applyCallerIdentity(
  form: EmergencyCaseForm,
  identity: CallerIdentity
): { form: EmergencyCaseForm; filledKeys: string[] } {
  const filledKeys: string[] = []
  const next: EmergencyCaseForm = {
    ...form,
    who: { ...form.who },
    where: { ...form.where },
  }

  if (identity.caller_name) {
    next.who.caller_name = identity.caller_name
    filledKeys.push('who.caller_name')
  }
  if (identity.caller_phone) {
    next.who.caller_phone = identity.caller_phone
    filledKeys.push('who.caller_phone')
  }
  if (identity.registered_address) {
    next.where.address = identity.registered_address
    filledKeys.push('where.address')
  }
  if (identity.floor_level) {
    next.where.floor_level = identity.floor_level
    filledKeys.push('where.floor_level')
  }
  if (identity.access_notes) {
    next.where.access_notes = identity.access_notes
    filledKeys.push('where.access_notes')
  }
  next.where.confidence = identity.address_confidence
  filledKeys.push('where.confidence')

  return { form: next, filledKeys }
}

/**
 * Shallow-merges a per-section patch into the form. Each top-level key
 * (where, what, who, …) is treated as a section whose own keys are merged
 * over the existing values. Returns the updated form.
 */
export function applyFormPatch(
  form: EmergencyCaseForm,
  patch: DeepPartialForm
): EmergencyCaseForm {
  const next: EmergencyCaseForm = { ...form }
  ;(Object.keys(patch) as (keyof EmergencyCaseForm)[]).forEach(section => {
    const sectionPatch = patch[section]
    if (sectionPatch && typeof sectionPatch === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(next as any)[section] = {
        ...(form[section] as object),
        ...(sectionPatch as object),
      }
    }
  })
  return next
}
