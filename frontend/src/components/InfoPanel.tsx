/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Badge,
    Button,
    Divider,
    Input,
    Text,
    Textarea,
    makeStyles,
    tokens,
} from '@fluentui/react-components'
import { HistoryRegular } from '@fluentui/react-icons'
import { ReactNode } from 'react'
import { EmergencyCaseForm } from '../types'

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    overflow: 'hidden',
  },
  header: {
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  priorBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  groupTitle: {
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    padding: '2px',
  },
  fieldLabel: {
    color: tokens.colorNeutralForeground3,
  },
  autoCaption: {
    color: tokens.colorBrandForeground1,
    fontStyle: 'italic',
  },
  unknownHint: {
    color: tokens.colorPaletteRedForeground1,
    fontStyle: 'italic',
  },
  footer: {
    padding: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    justifyContent: 'flex-start',
    flexShrink: 0,
  },
})

interface Props {
  form: EmergencyCaseForm
  autoFilledFields?: Set<string>
  recentlyChangedFields?: Set<string>
  unknownNumber?: boolean
  incomingPhone?: string
  priorIncidentsCount?: number
  /** Called when the operator edits a field. Path is "section.key". */
  onFieldChange?: (path: string, value: string | number) => void
  onSubmit?: () => void
}

export function InfoPanel({
  form,
  autoFilledFields,
  recentlyChangedFields,
  unknownNumber,
  incomingPhone,
  priorIncidentsCount = 0,
  onFieldChange,
  onSubmit,
}: Props) {
  const styles = useStyles()
  const isAuto = (key: string) => autoFilledFields?.has(key) ?? false
  const isChanged = (key: string) =>
    recentlyChangedFields?.has(key) ?? false

  const fieldClass = (key: string) =>
    `${styles.field}${isChanged(key) ? ' field-highlight' : ''}`

  const update =
    (path: string, transform: (raw: string) => string | number = v => v) =>
    (_: unknown, data: { value: string }) => {
      onFieldChange?.(path, transform(data.value))
    }

  const renderCaption = (key: string, extra?: ReactNode): ReactNode => {
    if (extra) return extra
    if (isAuto(key)) {
      return (
        <Text size={100} className={styles.autoCaption}>
          auto-filled from caller ID
        </Text>
      )
    }
    return null
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <Text size={500} weight="semibold">
            InfoLog — Incident Information
          </Text>
        </div>
        {priorIncidentsCount > 0 && (
          <div className={styles.priorBadgeRow}>
            <Badge appearance="tint" color="warning" icon={<HistoryRegular />}>
              {priorIncidentsCount} prior incident
              {priorIncidentsCount === 1 ? '' : 's'} at this address
            </Badge>
          </div>
        )}
      </div>

      <div className={styles.scrollArea}>
        {/* ── Caller ──────────────────────────────────────────────────── */}
        <div className={styles.group}>
          <Text size={200} weight="semibold" className={styles.groupTitle}>
            Caller
          </Text>

          <div className={fieldClass('who.caller_name')}>
            <Text size={200} className={styles.fieldLabel}>
              Name
            </Text>
            <Input
              value={form.who.caller_name}
              onChange={update('who.caller_name')}
            />
            {renderCaption('who.caller_name')}
          </div>

          <div className={fieldClass('who.caller_phone')}>
            <Text size={200} className={styles.fieldLabel}>
              Phone
            </Text>
            <Input
              value={form.who.caller_phone || (incomingPhone ?? '')}
              onChange={update('who.caller_phone')}
            />
            {unknownNumber ? (
              <Text size={100} className={styles.unknownHint}>
                Unknown number — manual entry required
              </Text>
            ) : (
              renderCaption('who.caller_phone')
            )}
          </div>

          <div className={fieldClass('who.relationship_to_emergency')}>
            <Text size={200} className={styles.fieldLabel}>
              Relationship to emergency
            </Text>
            <Input
              value={form.who.relationship_to_emergency}
              onChange={update('who.relationship_to_emergency')}
            />
          </div>
        </div>

        <Divider />

        {/* ── Location ─────────────────────────────────────────────────── */}
        <div className={styles.group}>
          <Text size={200} weight="semibold" className={styles.groupTitle}>
            Location
          </Text>

          <div className={fieldClass('where.address')}>
            <Text size={200} className={styles.fieldLabel}>
              Address
            </Text>
            <Input
              value={form.where.address}
              onChange={update('where.address')}
            />
            {renderCaption('where.address')}
          </div>

          <div className={fieldClass('where.floor_level')}>
            <Text size={200} className={styles.fieldLabel}>
              Floor / Unit
            </Text>
            <Input
              value={form.where.floor_level}
              onChange={update('where.floor_level')}
            />
            {renderCaption('where.floor_level')}
          </div>

          <div className={fieldClass('where.access_notes')}>
            <Text size={200} className={styles.fieldLabel}>
              Access notes
            </Text>
            <Textarea
              value={form.where.access_notes}
              rows={2}
              onChange={(_, data) =>
                onFieldChange?.('where.access_notes', data.value)
              }
            />
            {renderCaption('where.access_notes')}
          </div>

          <div className={fieldClass('where.confidence')}>
            <Badge
              appearance="tint"
              color={
                form.where.confidence === 'high'
                  ? 'success'
                  : form.where.confidence === 'medium'
                    ? 'warning'
                    : 'danger'
              }
            >
              Location confidence: {form.where.confidence}
            </Badge>
          </div>
        </div>

        <Divider />

        {/* ── Nature of emergency ──────────────────────────────────────── */}
        <div className={styles.group}>
          <Text size={200} weight="semibold" className={styles.groupTitle}>
            Nature of emergency
          </Text>

          <div className={fieldClass('what.emergency_type')}>
            <Text size={200} className={styles.fieldLabel}>
              Type
            </Text>
            <Input
              value={form.what.emergency_type}
              onChange={update('what.emergency_type')}
            />
          </div>

          <div className={fieldClass('what.description')}>
            <Text size={200} className={styles.fieldLabel}>
              Description
            </Text>
            <Textarea
              value={form.what.description}
              rows={3}
              onChange={(_, data) =>
                onFieldChange?.('what.description', data.value)
              }
            />
          </div>

          <div className={fieldClass('what.severity_estimate')}>
            <Text size={200} className={styles.fieldLabel}>
              Severity
            </Text>
            <Input
              value={form.what.severity_estimate}
              onChange={update('what.severity_estimate')}
            />
          </div>
        </div>

        <Divider />

        {/* ── People ──────────────────────────────────────────────────── */}
        <div className={styles.group}>
          <Text size={200} weight="semibold" className={styles.groupTitle}>
            People
          </Text>

          <div className={fieldClass('how_many.people_affected')}>
            <Text size={200} className={styles.fieldLabel}>
              People affected
            </Text>
            <Input
              type="number"
              value={String(form.how_many.people_affected)}
              onChange={update('how_many.people_affected', v =>
                Number(v) || 0
              )}
            />
          </div>

          <div className={fieldClass('how_many.casualties_count')}>
            <Text size={200} className={styles.fieldLabel}>
              Casualties
            </Text>
            <Input
              type="number"
              value={String(form.how_many.casualties_count)}
              onChange={update('how_many.casualties_count', v =>
                Number(v) || 0
              )}
            />
          </div>
        </div>

        <Divider />

        {/* ── Hazards ─────────────────────────────────────────────────── */}
        <div className={styles.group}>
          <Text size={200} weight="semibold" className={styles.groupTitle}>
            Hazards
          </Text>
          <div className={fieldClass('additional_info.hazards')}>
            <Textarea
              value={form.additional_info.hazards}
              rows={2}
              onChange={(_, data) =>
                onFieldChange?.('additional_info.hazards', data.value)
              }
            />
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <Button appearance="primary" onClick={onSubmit}>
          Submit
        </Button>
      </div>
    </div>
  )
}
