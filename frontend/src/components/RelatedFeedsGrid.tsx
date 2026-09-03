/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Badge, Skeleton, SkeletonItem, Text, makeStyles, tokens } from '@fluentui/react-components'
import { BotSparkleRegular } from '@fluentui/react-icons'
import { useRef } from 'react'
import { getVideoAssetUrl } from '../data/videoScenarios'
import { AiTrigger, CameraFeed } from '../types'

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM,
    gap: tokens.spacingVerticalS,
    overflow: 'hidden',
  },
  caption: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  captionSubline: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  aggregateStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    flexShrink: 0,
  },
  aggregateNum: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  aggregateArrow: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  aggregateTotal: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: tokens.spacingHorizontalS,
    flex: 1,
    minHeight: 0,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  tile: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: '#000',
    cursor: 'pointer',
    overflow: 'hidden',
    minHeight: 0,
    transition: 'transform 0.15s, box-shadow 0.15s',
    '&:hover, &:focus-visible': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
      outline: 'none',
    },
  },
  evidenceBadgeWrap: {
    position: 'absolute',
    top: tokens.spacingVerticalXS,
    left: tokens.spacingHorizontalXS,
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    alignItems: 'flex-start',
  },
  confidenceChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
  },
  thumbWrap: {
    position: 'relative',
    flex: 1,
    minHeight: '80px',
    backgroundColor: '#000',
  },
  thumbVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  meta: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  metaCamera: {
    fontWeight: tokens.fontWeightSemibold,
  },
  metaReason: {
    color: tokens.colorNeutralForeground3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  skeletonTile: {
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground2,
  },
})

interface Props {
  feeds: CameraFeed[]
  scenarioId: string
  ready: boolean
  onPromote: (cameraId: string) => void
  /** AI trigger metadata; used to render the aggregate-confidence strip + reworded caption. */
  trigger?: AiTrigger | null
}

/**
 * V4 + V5 — three correlated thumbnails with hover preview and click-to-promote.
 * Each tile is its own muted <video> that stays paused at the first frame
 * until hover, when it plays inline. Click promotes to V1.
 *
 * Tiles also carry an evidence-signal chip + per-source confidence (V4),
 * and an aggregate-confidence strip is rendered above the grid (V5 group).
 */
export function RelatedFeedsGrid({ feeds, scenarioId, ready, onPromote, trigger }: Props) {
  const styles = useStyles()

  const aggregate = trigger?.confidence
  const evidenceMap = new Map<string, { signal: string; confidence: number; label: string }>()
  if (trigger) {
    for (const e of trigger.evidence) {
      // "primary" → "Primary"; "related-1" → "Source 1"; etc.
      const label =
        e.source === 'primary'
          ? 'Primary'
          : `Source ${e.source.replace('related-', '')}`
      evidenceMap.set(e.source, { signal: e.signal, confidence: e.confidence, label })
    }
  }

  // Map each feed (by index) to its evidence entry: feeds[0] → related-1, etc.
  const feedEvidence = (idx: number) => evidenceMap.get(`related-${idx + 1}`)

  return (
    <div className={styles.panel} data-testid="related-feeds-grid">
      <div className={styles.caption}>
        <BotSparkleRegular fontSize={16} />
        <Text size={200}>
          {trigger
            ? `Corroborating sources · AI cross-referenced these feeds to raise trigger confidence to ${aggregate?.toFixed(2) ?? '—'}`
            : 'AI highlight related feed based on proximity and activity'}
        </Text>
      </div>
      {trigger && (
        <Text size={100} className={styles.captionSubline}>
          Each source independently shows fire/smoke or evacuation activity
          consistent with the primary alert.
        </Text>
      )}
      {trigger && (
        <div className={styles.aggregateStrip} aria-label="Aggregate confidence breakdown">
          {trigger.evidence.map((e, i) => (
            <span key={e.source}>
              <Text size={100}>
                {evidenceMap.get(e.source)?.label ?? e.source}{' '}
                <span className={styles.aggregateNum}>{e.confidence.toFixed(2)}</span>
              </Text>
              {i < trigger.evidence.length - 1 && (
                <Text size={100} className={styles.aggregateArrow}>
                  {'  +  '}
                </Text>
              )}
            </span>
          ))}
          <Text size={100} className={styles.aggregateArrow}>
            {'  →  '}
          </Text>
          <Text size={100}>
            Aggregate{' '}
            <span className={styles.aggregateTotal}>{aggregate?.toFixed(2)}</span>
          </Text>
        </div>
      )}
      <div className={styles.grid}>
        {ready
          ? feeds.map((f, i) => (
              <RelatedFeedTile
                key={f.camera_id}
                feed={f}
                scenarioId={scenarioId}
                onPromote={onPromote}
                evidenceSignal={f.evidence_signal ?? feedEvidence(i)?.signal}
                evidenceConfidence={
                  f.evidence_confidence ?? feedEvidence(i)?.confidence
                }
              />
            ))
          : Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className={styles.skeletonTile}>
                <SkeletonItem shape="rectangle" size={96} />
                <SkeletonItem shape="rectangle" size={16} style={{ margin: 8 }} />
              </Skeleton>
            ))}
      </div>
    </div>
  )
}

function RelatedFeedTile({
  feed,
  scenarioId,
  onPromote,
  evidenceSignal,
  evidenceConfidence,
}: {
  feed: CameraFeed
  scenarioId: string
  onPromote: (cameraId: string) => void
  evidenceSignal?: string
  evidenceConfidence?: number
}) {
  const styles = useStyles()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const url = getVideoAssetUrl(scenarioId, feed.source)

  const handleEnter = () => {
    videoRef.current?.play().catch(() => {})
  }
  const handleLeave = () => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = 0
  }
  const handleClick = () => onPromote(feed.camera_id)
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPromote(feed.camera_id)
    }
  }

  return (
    <div
      className={styles.tile}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKey}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      aria-label={`Promote camera ${feed.camera_id} (${feed.location}) to primary feed. ${feed.correlation_reason ?? ''} ${evidenceSignal ? `Evidence signal: ${evidenceSignal}.` : ''} ${evidenceConfidence !== undefined ? `Confidence ${evidenceConfidence.toFixed(2)}.` : ''}`}
    >
      <div className={styles.thumbWrap}>
        {(evidenceSignal || evidenceConfidence !== undefined) && (
          <div className={styles.evidenceBadgeWrap}>
            {evidenceSignal && (
              <Badge appearance="filled" color="brand" size="small" icon={<BotSparkleRegular />}>
                + {evidenceSignal}
              </Badge>
            )}
            {evidenceConfidence !== undefined && (
              <span className={styles.confidenceChip}>
                {evidenceConfidence.toFixed(2)}
              </span>
            )}
          </div>
        )}
        <video
          ref={videoRef}
          className={styles.thumbVideo}
          src={url}
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
      <div className={styles.meta}>
        <Text size={200} className={styles.metaCamera}>
          Cam {feed.camera_id}
        </Text>
        {feed.correlation_reason && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
            <BotSparkleRegular fontSize={12} style={{ flexShrink: 0, marginTop: '2px', color: tokens.colorBrandForeground1 }} />
            <Text size={100} className={styles.metaReason}>
              {feed.correlation_reason}
            </Text>
          </div>
        )}
        {!feed.correlation_reason && (
          <Text size={100} className={styles.metaReason}>
            Primary alerting feed
          </Text>
        )}
      </div>
    </div>
  )
}
