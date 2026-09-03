/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Spinner, Text, makeStyles, tokens } from '@fluentui/react-components'
import { BotSparkleRegular, PauseRegular, PlayRegular } from '@fluentui/react-icons'
import { useEffect, useRef, useState } from 'react'
import { getVideoAssetUrl } from '../data/videoScenarios'
import { CameraFeed } from '../types'

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
  banner: {
    display: 'flex',
    flexDirection: 'column',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    flexShrink: 0,
    gap: tokens.spacingVerticalXS,
  },
  bannerTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  bannerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
  aiDescriptionRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalXS,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusSmall,
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
  },
  aiDescriptionIcon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
    marginTop: '2px',
  },
  aiBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  videoWrap: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  overlaySvg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  overlayLabel: {
    position: 'absolute',
    top: tokens.spacingVerticalS,
    left: tokens.spacingHorizontalS,
    backgroundColor: 'rgba(0,0,0,0.65)',
    color: '#fff',
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  playToggle: {
    position: 'absolute',
    bottom: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: 0,
    transition: 'opacity 0.2s',
    '&:hover, &:focus-visible': {
      opacity: 1,
    },
  },
  videoWrapInteractive: {
    '&:hover button': { opacity: 1 },
  },
  placeholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalS,
    color: '#fff',
    backgroundColor: '#000',
  },
})

interface Props {
  feed: CameraFeed
  scenarioId: string
  /** When false, render a placeholder instead of the live video element. */
  live: boolean
}

/**
 * V1 + V2 + V3 — primary feed player with selected-feed banner and AI
 * highlight overlay. Per VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §5.2 the
 * <video> element is reused across promotions: only the `src` attribute
 * is mutated, never the element itself, so promote-to-primary stays under
 * the 300 ms budget.
 */
export function PrimaryFeedPanel({ feed, scenarioId, live }: Props) {
  const styles = useStyles()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [paused, setPaused] = useState(false)

  // Imperatively set src so we never trigger a remount when the feed swaps.
  // `live` is in the deps because the <video> element is conditionally
  // rendered — the ref is null until live becomes true, so we must re-run
  // when it mounts.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !live) return
    const url = getVideoAssetUrl(scenarioId, feed.source)
    v.src = url
    v.load()
    // Best-effort autoplay; ignored if browser blocks (rare since muted).
    v.play().catch(() => {})
  }, [feed.source, scenarioId, live])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => {})
      setPaused(false)
    } else {
      v.pause()
      setPaused(true)
    }
  }

  const overlay = feed.ai_overlay

  return (
    <div className={styles.panel} data-testid="primary-feed-panel">
      <div className={styles.banner}>
        <div className={styles.bannerTopRow}>
          <div className={styles.bannerLeft}>
            <Text size={300} weight="semibold">
              Selected feed:
            </Text>
            <Text size={300}>
              {feed.location} · Camera No: {feed.camera_id}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feed.correlation_reason && (
              <div className={styles.aiBadge}>
                <BotSparkleRegular fontSize={14} />
                <Text size={200}>{feed.correlation_reason}</Text>
              </div>
            )}
            {overlay && (
              <div className={styles.aiBadge}>
                <BotSparkleRegular fontSize={16} />
                <Text size={200}>AI highlight</Text>
              </div>
            )}
          </div>
        </div>
        {feed.ai_description && (
          <div className={styles.aiDescriptionRow}>
            <BotSparkleRegular fontSize={14} className={styles.aiDescriptionIcon} />
            <Text size={200}>
              <Text size={200} weight="semibold">AI description: </Text>
              {feed.ai_description}
            </Text>
          </div>
        )}
      </div>
      <div className={`${styles.videoWrap} ${styles.videoWrapInteractive}`}>
        {live ? (
          <>
            <video
              ref={videoRef}
              className={styles.video}
              muted
              loop
              playsInline
              autoPlay
              data-camera-id={feed.camera_id}
            />
            {overlay && (
              <>
                <svg
                  className={styles.overlaySvg}
                  viewBox="0 0 1 1"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <rect
                    x={overlay.box.x}
                    y={overlay.box.y}
                    width={overlay.box.w}
                    height={overlay.box.h}
                    fill="none"
                    stroke="#ff7a00"
                    strokeWidth={0.006}
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className={styles.overlayLabel}>
                  <BotSparkleRegular fontSize={14} />
                  <span>{overlay.label}</span>
                </div>
              </>
            )}
            <button
              type="button"
              className={styles.playToggle}
              onClick={togglePlay}
              aria-label={paused ? 'Play feed' : 'Pause feed'}
            >
              {paused ? <PlayRegular fontSize={20} /> : <PauseRegular fontSize={20} />}
            </button>
          </>
        ) : (
          <div className={styles.placeholder}>
            <Spinner size="small" appearance="inverted" />
            <Text size={200} style={{ color: '#fff' }}>
              Connecting to Camera {feed.camera_id}…
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
