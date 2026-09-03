/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Badge,
    Button,
    Text,
    Tooltip,
    makeStyles,
    tokens,
} from '@fluentui/react-components'
import { CheckmarkRegular, DismissRegular, LinkRegular, OpenRegular } from '@fluentui/react-icons'
import { useEffect, useRef, useState } from 'react'
import { RelatedIncident } from '../types'

const useStyles = makeStyles({
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow28,
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateX(100%)',
    transition: 'transform 0.2s ease-out',
    zIndex: 10,
  },
  drawerOpen: {
    transform: 'translateX(0)',
  },
  header: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  sectionLabel: {
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
  footer: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
})

interface Props {
  incident: RelatedIncident | null
  onClose: () => void
}

/**
 * V11 — incident detail side drawer. Positioned with `position: absolute`
 * inside the workspace's right column, so it never overlays V1.
 */
export function IncidentDetailDrawer({ incident, onClose }: Props) {
  const styles = useStyles()
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const [crossReferenced, setCrossReferenced] = useState(false)
  const open = incident != null

  // Esc dismisses
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Move focus into the drawer on open; reset cross-reference state
  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus()
      setCrossReferenced(false)
    }
  }, [open])

  const opened = incident
    ? new Date(incident.opened_at).toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      })
    : ''

  return (
    <div
      className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
      role="dialog"
      aria-modal="false"
      aria-hidden={!open}
      aria-label={incident ? `Incident detail ${incident.cad_id}` : 'Incident detail'}
    >
      <div className={styles.header}>
        <div className={styles.badgeRow}>
          <Text size={300} weight="semibold">
            {incident?.cad_id}
          </Text>
          {incident && (
            <>
              <Badge appearance="filled" color="warning" size="small">
                {incident.badge}
              </Badge>
              <Badge appearance="tint" size="small">
                {incident.priority}
              </Badge>
              <Badge appearance="outline" size="small">
                {incident.type}
              </Badge>
            </>
          )}
        </div>
        <Button
          ref={closeBtnRef}
          appearance="subtle"
          icon={<DismissRegular />}
          onClick={onClose}
          aria-label="Close incident detail"
        />
      </div>
      {incident && (
        <>
          <div className={styles.body}>
            <div className={styles.section}>
              <Text size={100} className={styles.sectionLabel}>
                Summary
              </Text>
              <Text size={300} weight="semibold">
                {incident.title}
              </Text>
              <Text size={200}>{incident.description}</Text>
            </div>
            <div className={styles.section}>
              <Text size={100} className={styles.sectionLabel}>
                Assigned units
              </Text>
              <Text size={200}>{incident.unit}</Text>
              <Text size={100}>ETA ~{incident.eta_minutes} minutes</Text>
            </div>
            <div className={styles.section}>
              <Text size={100} className={styles.sectionLabel}>
                Timeline
              </Text>
              <Text size={200}>Opened {opened}</Text>
            </div>
            <div className={styles.section}>
              <Text size={100} className={styles.sectionLabel}>
                Notes
              </Text>
              <Text size={200}>—</Text>
            </div>
          </div>
          <div className={styles.footer}>
            <Button
              appearance={crossReferenced ? 'primary' : 'secondary'}
              icon={crossReferenced ? <CheckmarkRegular /> : <LinkRegular />}
              onClick={() => setCrossReferenced(prev => !prev)}
            >
              {crossReferenced ? 'Cross-referenced' : 'Cross-reference with current alert'}
            </Button>
            <Tooltip
              content="Routed incident page is a future hook"
              relationship="description"
            >
              <Button appearance="primary" icon={<OpenRegular />} disabled>
                Open full record
              </Button>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  )
}
