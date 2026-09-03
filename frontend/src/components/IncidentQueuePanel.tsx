/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Badge,
    Skeleton,
    SkeletonItem,
    Text,
    makeStyles,
    tokens,
} from '@fluentui/react-components'
import { BotSparkleRegular, ChevronRightRegular } from '@fluentui/react-icons'
import { useMemo } from 'react'
import { RelatedIncident } from '../types'

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  header: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    flexShrink: 0,
  },
  list: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: tokens.spacingHorizontalS,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  card: {
    cursor: 'pointer',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    transition: 'background-color 0.15s, box-shadow 0.15s',
    '&:hover, &:focus-visible': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      boxShadow: `inset 0 0 0 1px ${tokens.colorBrandStroke1}`,
      outline: 'none',
    },
  },
  cardSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: `inset 0 0 0 2px ${tokens.colorBrandStroke1}`,
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
  cadId: {
    fontWeight: tokens.fontWeightSemibold,
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  unit: {
    color: tokens.colorNeutralForeground3,
  },
  viewLink: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorBrandForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  empty: {
    padding: tokens.spacingHorizontalL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  relevanceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXXS,
  },
  relevanceBarOuter: {
    flex: 1,
    height: '6px',
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusSmall,
    overflow: 'hidden',
    minWidth: '60px',
    maxWidth: '140px',
  },
  relevanceBarInner: {
    height: '100%',
    transition: 'width 0.3s ease-out',
  },
  relevanceVal: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '32px',
  },
  whyRelated: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '4px',
  },
})

interface Props {
  incidents: RelatedIncident[]
  ready: boolean
  selectedCadId?: string | null
  onSelect: (cadId: string) => void
}

const PRIORITY_COLOR: Record<RelatedIncident['priority'], 'danger' | 'warning' | 'informative'> = {
  P1: 'danger',
  P2: 'warning',
  P3: 'informative',
}

/** V6 — related-incidents queue. Click opens the V11 side drawer. Cards are
 *  sorted by AI relevance descending so the most relevant incident sits at the top. */
export function IncidentQueuePanel({ incidents, ready, selectedCadId, onSelect }: Props) {
  const styles = useStyles()

  const sortedIncidents = useMemo(
    () =>
      [...incidents].sort(
        (a, b) => (b.relevance ?? 0) - (a.relevance ?? 0)
      ),
    [incidents]
  )

  return (
    <div className={styles.panel} data-testid="incident-queue-panel">
      <div className={styles.header}>
        <Text size={300} weight="semibold">
          Possible related incidents
        </Text>
      </div>
      <div className={styles.list} role="list">
        {!ready ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i}>
              <SkeletonItem shape="rectangle" size={64} />
            </Skeleton>
          ))
        ) : sortedIncidents.length === 0 ? (
          <div className={styles.empty}>
            <Text size={200}>No related incidents</Text>
          </div>
        ) : (
          sortedIncidents.map(inc => (
            <IncidentCard
              key={inc.cad_id}
              incident={inc}
              selected={inc.cad_id === selectedCadId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}

function IncidentCard({
  incident,
  selected,
  onSelect,
}: {
  incident: RelatedIncident
  selected: boolean
  onSelect: (cadId: string) => void
}) {
  const styles = useStyles()
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(incident.cad_id)
    }
  }
  const relevance = incident.relevance
  const relevanceColor =
    relevance == null
      ? tokens.colorNeutralForeground3
      : relevance >= 0.85
        ? tokens.colorPaletteRedForeground1
        : relevance >= 0.7
          ? tokens.colorBrandForeground1
          : tokens.colorNeutralForeground3
  return (
    <div
      role="listitem button"
      tabIndex={0}
      className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
      onClick={() => onSelect(incident.cad_id)}
      onKeyDown={handleKey}
      aria-label={`${incident.title}. Priority ${incident.priority}. ETA ${incident.eta_minutes} minutes.${relevance != null ? ` AI relevance ${relevance.toFixed(2)}.` : ''}${incident.relevance_reason ? ` Why related: ${incident.relevance_reason}.` : ''}`}
    >
      <div className={styles.topRow}>
        <Badge appearance="filled" color="warning" size="small">
          {incident.badge}
        </Badge>
        <Badge appearance="tint" color={PRIORITY_COLOR[incident.priority]} size="small">
          {incident.priority}
        </Badge>
        <Badge appearance="outline" size="small">
          {incident.type}
        </Badge>
        <Text size={100} className={styles.cadId}>
          {incident.cad_id}
        </Text>
      </div>
      <Text size={200} className={styles.title}>
        {incident.title}
      </Text>
      <Text size={100}>{incident.description}</Text>
      {relevance != null && (
        <div
          className={styles.relevanceRow}
          title={`AI relevance score: ${relevance.toFixed(2)}`}
        >
          <BotSparkleRegular fontSize={12} style={{ color: tokens.colorBrandForeground1 }} />
          <Text size={100}>Relevance</Text>
          <div className={styles.relevanceBarOuter} aria-hidden="true">
            <div
              className={styles.relevanceBarInner}
              style={{
                width: `${Math.round(relevance * 100)}%`,
                backgroundColor: relevanceColor,
              }}
            />
          </div>
          <Text size={100} className={styles.relevanceVal}>
            {relevance.toFixed(2)}
          </Text>
        </div>
      )}
      {incident.relevance_reason && (
        <Text size={100} className={styles.whyRelated}>
          Why related: {incident.relevance_reason}
        </Text>
      )}
      <div className={styles.bottomRow}>
        <Text size={100} className={styles.unit}>
          {incident.unit} · ETA ~{incident.eta_minutes} min
        </Text>
        <span className={styles.viewLink}>
          View Call <ChevronRightRegular fontSize={14} />
        </span>
      </div>
    </div>
  )
}
