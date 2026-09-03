/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Badge,
    Button,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    Skeleton,
    SkeletonItem,
    Text,
    makeStyles,
    tokens,
} from '@fluentui/react-components'
import {
    BotSparkleRegular,
    CheckmarkCircleRegular,
    DismissRegular,
    SearchRegular,
} from '@fluentui/react-icons'
import { useState } from 'react'
import { AiTrigger, AiTriggerStatus } from '../types'

const useStyles = makeStyles({
  banner: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    borderTopWidth: '1px',
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderTopColor: tokens.colorPaletteRedBorder1,
    borderRightColor: tokens.colorPaletteRedBorder1,
    borderBottomColor: tokens.colorPaletteRedBorder1,
    borderLeftColor: tokens.colorPaletteRedBorder1,
    backgroundColor: tokens.colorPaletteRedBackground1,
    boxShadow: `inset 4px 0 0 0 ${tokens.colorPaletteRedForeground1}`,
    flexShrink: 0,
  },
  bannerDismissed: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderTopColor: tokens.colorNeutralStroke2,
    borderRightColor: tokens.colorNeutralStroke2,
    borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2,
    boxShadow: `inset 4px 0 0 0 ${tokens.colorNeutralStroke1}`,
    opacity: 0.85,
  },
  bannerAcknowledged: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderTopColor: tokens.colorPaletteYellowBorder1,
    borderRightColor: tokens.colorPaletteYellowBorder1,
    borderBottomColor: tokens.colorPaletteYellowBorder1,
    borderLeftColor: tokens.colorPaletteYellowBorder1,
    boxShadow: `inset 4px 0 0 0 ${tokens.colorPaletteYellowForeground1}`,
  },
  bannerDispatched: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    borderTopColor: tokens.colorPaletteGreenBorder1,
    borderRightColor: tokens.colorPaletteGreenBorder1,
    borderBottomColor: tokens.colorPaletteGreenBorder1,
    borderLeftColor: tokens.colorPaletteGreenBorder1,
    boxShadow: `inset 4px 0 0 0 ${tokens.colorPaletteGreenForeground1}`,
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorBrandForeground1,
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  cadId: {
    color: tokens.colorNeutralForeground2,
  },
  spacer: { flex: 1 },
  statusPill: {
    fontWeight: tokens.fontWeightSemibold,
  },
  classification: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    color: tokens.colorNeutralForeground2,
  },
  confidenceVal: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  actionsRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalXS,
  },
  ackButton: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
  },
  dismissButton: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': {
      backgroundColor: tokens.colorPaletteRedForeground1,
      color: tokens.colorNeutralForegroundOnBrand,
    },
  },
  shimmerWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
})

interface Props {
  trigger: AiTrigger | null
  status: AiTriggerStatus
  onAcknowledge: () => void
  onDismiss: () => void
  onRequestMoreEvidence: () => void
}

const STATUS_LABEL: Record<AiTriggerStatus, string> = {
  'awaiting-validation': 'Awaiting validation',
  acknowledged: 'Acknowledged',
  dispatched: 'Dispatched',
  dismissed: 'Dismissed',
}

const STATUS_COLOR: Record<
  AiTriggerStatus,
  'severe' | 'warning' | 'success' | 'subtle'
> = {
  'awaiting-validation': 'severe',
  acknowledged: 'warning',
  dispatched: 'success',
  dismissed: 'subtle',
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } catch {
    return iso
  }
}

/**
 * V0 — AI Incident Trigger Banner. Anchored above the primary feed in the
 * left column. Surfaces the AI-raised CAD record, its triage chips, aggregate
 * confidence, status pill, and the three operator validation actions.
 *
 * Spec: docs/VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md §5.0
 */
export function AiTriggerBanner({
  trigger,
  status,
  onAcknowledge,
  onDismiss,
  onRequestMoreEvidence,
}: Props) {
  const styles = useStyles()
  const [confirmDismissOpen, setConfirmDismissOpen] = useState(false)

  // Loading shimmer used between Start and step 0.5 (~0.5 s)
  if (!trigger) {
    return (
      <div className={styles.banner} data-testid="ai-trigger-banner-loading">
        <div className={styles.topRow}>
          <span className={styles.iconWrap}>
            <BotSparkleRegular fontSize={18} />
          </span>
          <Text className={styles.title}>AI INCIDENT TRIGGER</Text>
          <span className={styles.spacer} />
          <Badge appearance="tint" color="subtle">
            Awaiting trigger…
          </Badge>
        </div>
        <div className={styles.shimmerWrap}>
          <Skeleton>
            <SkeletonItem shape="rectangle" size={16} />
          </Skeleton>
          <Skeleton>
            <SkeletonItem shape="rectangle" size={12} style={{ width: '60%' }} />
          </Skeleton>
        </div>
      </div>
    )
  }

  const bannerVariantClass =
    status === 'dismissed'
      ? styles.bannerDismissed
      : status === 'acknowledged'
        ? styles.bannerAcknowledged
        : status === 'dispatched'
          ? styles.bannerDispatched
          : ''

  const ackDisabled = status !== 'awaiting-validation'
  const dismissDisabled = status !== 'awaiting-validation'
  const moreDisabled = status !== 'awaiting-validation'

  const handleDismissClick = () => setConfirmDismissOpen(true)
  const handleConfirmDismiss = () => {
    setConfirmDismissOpen(false)
    onDismiss()
  }

  return (
    <div
      className={`${styles.banner} ${bannerVariantClass}`}
      role="region"
      aria-label="AI incident trigger"
      data-testid="ai-trigger-banner"
    >
      <div className={styles.topRow}>
        <span className={styles.iconWrap} title="AI generated">
          <BotSparkleRegular fontSize={18} />
        </span>
        <Text className={styles.title} size={300}>
          AI INCIDENT TRIGGER
        </Text>
        <Text className={styles.cadId} size={200}>
          · {trigger.cad_id}
        </Text>
        <Badge appearance="filled" color="danger" size="small">
          {trigger.priority}
        </Badge>
        <Badge appearance="filled" color="severe" size="small">
          {trigger.severity} SEVERITY
        </Badge>
        <span className={styles.spacer} />
        <Badge
          className={styles.statusPill}
          appearance="tint"
          color={STATUS_COLOR[status]}
          size="medium"
        >
          {STATUS_LABEL[status]}
        </Badge>
      </div>

      <Text className={styles.classification} size={300}>
        {trigger.classification} — {trigger.short_location}
      </Text>

      <div className={styles.metaRow}>
        <Text size={200}>
          Detected <span className={styles.confidenceVal}>{formatTime(trigger.triggered_at)}</span>
        </Text>
        <Text size={200}>
          Confidence{' '}
          <span className={styles.confidenceVal}>
            {trigger.confidence.toFixed(2)}
          </span>
        </Text>
        <Text size={200}>
          <span className={styles.confidenceVal}>{trigger.evidence.length}</span>{' '}
          corroborating sources
        </Text>
      </div>

      <div className={styles.actionsRow}>
        <Button
          appearance="primary"
          icon={<CheckmarkCircleRegular />}
          onClick={onAcknowledge}
          disabled={ackDisabled}
          size="small"
          className={ackDisabled ? undefined : styles.ackButton}
        >
          Acknowledge & dispatch
        </Button>
        <Button
          appearance="secondary"
          icon={<SearchRegular />}
          onClick={onRequestMoreEvidence}
          disabled={moreDisabled}
          size="small"
        >
          Request more evidence
        </Button>
        <Button
          appearance="secondary"
          icon={<DismissRegular />}
          onClick={handleDismissClick}
          disabled={dismissDisabled}
          size="small"
          className={dismissDisabled ? undefined : styles.dismissButton}
        >
          Dismiss as false positive
        </Button>
      </div>

      <Dialog
        open={confirmDismissOpen}
        onOpenChange={(_, data) => setConfirmDismissOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Dismiss AI trigger?</DialogTitle>
            <DialogContent>
              <Text>
                You are about to dismiss <strong>{trigger.cad_id}</strong> (
                {trigger.classification}, {trigger.priority} / {trigger.severity})
                as a false positive. The workspace will reset to its idle state.
              </Text>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleConfirmDismiss}>
                Dismiss trigger
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
