/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CallerIdentity } from '../types'

/**
 * Hardcoded reverse-lookup directory used by the demo to simulate a
 * caller-ID enrichment service. Production would replace this with a
 * real lookup (see DEMO_REQUIREMENTS.md §8).
 */
export const CALLER_DIRECTORY: Record<string, CallerIdentity> = {
  '+6591234567': {
    caller_name: 'Mdm Tan Bee Leng',
    caller_phone: '+65 9123 4567',
    registered_address: 'Blk 84 Commonwealth Crescent, #08-12, Singapore 140084',
    floor_level: '8th floor',
    access_notes: 'HDB lift lobby facing Crescent Link; unit along common corridor',
    address_confidence: 'high',
    prior_incidents_count: 0,
  },
  '+6598765432': {
    caller_name: 'Mr Rajesh Kumar',
    caller_phone: '+65 9876 5432',
    registered_address: 'Blk 215 Bishan Street 23, #14-307, Singapore 570215',
    floor_level: '14th floor',
    access_notes: 'HDB block — caller is a bystander, not at registered address',
    address_confidence: 'high',
    prior_incidents_count: 1,
  },
}

const normalize = (phone: string) => phone.replace(/[\s\-()]/g, '')

export function lookupCaller(phone: string | undefined): CallerIdentity | null {
  if (!phone) return null
  return CALLER_DIRECTORY[normalize(phone)] ?? null
}
