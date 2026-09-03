/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { VideoScenario } from '../types'

/**
 * Resolve a manifest-relative asset path (e.g. "primary.mp4") to a URL the
 * <video> element can load. Both dev (Vite middleware) and prod (Flask route)
 * serve under the same path: /video-assets/<scenario-id>/<file>.
 */
export function getVideoAssetUrl(scenarioId: string, source: string): string {
  return `/video-assets/${scenarioId}/${source}`
}

/**
 * Frontend-only video scenario fixtures. Mirrors the canonical YAML at
 * data/video-scenarios/<id>/manifest.yml. Keep the two in sync until a
 * backend manifest loader is added (future hook).
 *
 * Schema reference: docs/VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §5.5
 */
export const VIDEO_SCENARIOS: VideoScenario[] = [
  {
    id: 'apartment-commonwealthcrescent',
    kind: 'video',
    title: 'Video: Apartment fire — Blk 84 Commonwealth Crescent',
    is_demo: true,
    ai_trigger: {
      cad_id: 'CAD-2026-00210',
      triggered_at: '2026-04-21T16:22:48+08:00',
      classification: 'Likely residential fire',
      short_location: 'Blk 84 Commonwealth Crescent #08-12',
      priority: 'P1',
      severity: 'HIGH',
      confidence: 0.94,
      status: 'awaiting-validation',
      evidence: [
        { source: 'primary', confidence: 0.91, signal: 'Active fire' },
        { source: 'related-1', confidence: 0.88, signal: 'Fire signature' },
        { source: 'related-2', confidence: 0.79, signal: 'Smoke plume' },
        { source: 'related-3', confidence: 0.72, signal: 'Evacuation activity' },
      ],
    },
    primary_feed: {
      camera_id: '042895',
      location: 'Blk 84 Commonwealth Crescent',
      source: 'primary.mp4',
      ai_overlay: {
        box: { x: 0.42, y: 0.28, w: 0.18, h: 0.22 },
        label: 'Active fire detected',
      },
      ai_description:
        'Active fire detected — bright orange flames emerging from a mid-floor unit window, extending outward and rising vertically. Fire appears contained to a single apartment with no visible spread to adjacent units. No visible occupants, firefighting activity, or evacuation efforts in scene.',
    },
    related_feeds: [
      {
        camera_id: '042901',
        location: 'Blk 84 Commonwealth Crescent — Common corridor (Level 8)',
        source: 'related-1.mp4',
        correlation_reason:
          'Same level — cluttered common corridor with active fire visible at affected unit',
        evidence_signal: 'Fire signature',
        evidence_confidence: 0.88,
      },
      {
        camera_id: '042907',
        location: 'Blk 84 Commonwealth Crescent — Adjacent surface carpark',
        source: 'related-2.mp4',
        correlation_reason:
          'Adjacent surface carpark — visible smoke; potential vertical/lateral spread, fire engine access route',
        evidence_signal: 'Smoke plume',
        evidence_confidence: 0.79,
      },
      {
        camera_id: '043120',
        location: 'Blk 84 Commonwealth Crescent — Void deck',
        source: 'related-3.mp4',
        correlation_reason:
          'Block void deck — sudden surge of residents evacuating; crowd-control needed',
        evidence_signal: 'Evacuation activity',
        evidence_confidence: 0.72,
      },
    ],
    related_incidents: [
      {
        cad_id: 'CAD-2026-00182',
        badge: 'PENDING',
        priority: 'P1',
        type: 'FIRE',
        title: 'Dispatch Fire response to CAD-2026-00182',
        description:
          'Loud explosion / blast heard from upper-floor HDB unit, same block — possible gas cylinder ignition',
        unit: 'Fire Engine 52',
        eta_minutes: 5,
        opened_at: '2026-04-21T16:23:11+08:00',
        relevance: 0.92,
        relevance_reason: 'same block · 2 floors above · ≤ 3 min apart',
      },
      {
        cad_id: 'CAD-2026-00190',
        badge: 'PENDING',
        priority: 'P2',
        type: 'MEDICAL',
        title: 'Dispatch Light Rescue + Ambulance to CAD-2026-00190',
        description:
          'Possible injured residents in neighbouring unit — smoke inhalation, mobility-impaired occupant reported',
        unit: 'Light Rescue + Ambulance 33',
        eta_minutes: 7,
        opened_at: '2026-04-21T16:25:02+08:00',
        relevance: 0.81,
        relevance_reason: 'adjacent unit · smoke inhalation consistent with primary fire',
      },
      {
        cad_id: 'CAD-2026-00178',
        badge: 'PENDING',
        priority: 'P3',
        type: 'POLICE',
        title: 'Dispatch Neighbourhood Police patrol to CAD-2026-00178',
        description:
          'Sudden disturbance at block void deck — residents evacuating en masse, crowd-control assistance requested',
        unit: 'Neighbourhood Police patrol',
        eta_minutes: 6,
        opened_at: '2026-04-21T16:18:44+08:00',
        relevance: 0.68,
        relevance_reason: 'same block void deck · evacuation activity matches related-3 feed',
      },
    ],
    dispatch_summary: {
      recommended_tab: 'FIRE',
      sections: {
        // Camera-derived metadata: block, floor, unit (from camera location feed)
        location: [
          'Blk 84 Commonwealth Crescent — high-rise HDB residential building',
          'Camera 042895 — façade view, mid-to-upper floor',
          'Affected unit estimated 8th floor (#08-12), along central vertical section',
          'Nearest landmark: Commonwealth MRT Exit B / Commonwealth Crescent Market',
        ],
        nature_of_emergency: [
          'Likely residential fire (AI classifier confidence 0.94)',
          'Residential unit fire — confirmed via video analytics',
          'Fire has breached unit interior and is extending outside the building façade',
        ],
        // NEW: concise plain observations directly from the video frame
        video_observations: [
          'Bright orange and yellow flames actively emerging from a window/balcony opening',
          'Flames extending outward and rising vertically — sustained combustion',
          'Heavy smoke visible above the affected opening',
          'No visible occupants, firefighting activity, or evacuation in scene',
          'Surrounding ground area is open residential setting, not directly impacted',
        ],
        people_affected: [
          'No visible occupants in affected unit from camera angle',
          'No people visible at neighbouring unit windows',
          'Occupant status within affected and adjacent units is unknown',
        ],
        // NEW: AI's possible interpretations of what is being observed
        interpretations: [
          'Possible fire contained to one apartment — no visible spread yet',
          'High likelihood of vertical spread along façade if unchecked',
          'Potential horizontal spread to neighbouring units due to proximity',
          'Adjacent units appear unoccupied from camera view, but interior status unknown',
        ],
        hazards: [
          'High-rise HDB — vertical-spread risk via façade and lift shaft',
          'Adjacent units within ~3 m horizontally of flame source',
          'Possible gas cylinder ignition (cross-ref CAD-2026-00182 explosion report)',
          'Unknown structural integrity of affected unit interior',
        ],
        recommended_units: [
          'Red Rhino 1 — Queenstown Fire Station (fire suppression)',
          'Fire Engine 51 (high-rise firefighting support)',
          'Ambulance 29 (smoke inhalation evaluation, casualties standby)',
          'Light Rescue 33 (extraction support for adjacent units if needed)',
        ],
        operator_notes: [],
      },
    },
  },
]

export function findVideoScenario(id: string): VideoScenario | undefined {
  return VIDEO_SCENARIOS.find(s => s.id === id)
}
