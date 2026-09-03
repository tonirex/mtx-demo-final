/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Badge,
    Button,
    Card,
    CardHeader,
    Dialog,
    DialogActions,
    DialogBody,
    DialogSurface,
    DialogTitle,
    makeStyles,
    ProgressBar,
    Tab,
    TabList,
    TabValue,
    Text,
    tokens,
} from '@fluentui/react-components'
import { useState } from 'react'
import { CaseResult } from '../types'

const useStyles = makeStyles({
  dialogBody: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    height: 'calc(90vh - 200px)',
    overflow: 'hidden',
  },
  headerBar: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    flexShrink: 0,
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  tabs: {
    flexShrink: 0,
  },
  tabContent: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
    width: '100%',
    alignContent: 'start',
  },
  card: {
    padding: tokens.spacingVerticalL,
    height: 'fit-content',
  },
  field: {
    marginBottom: tokens.spacingVerticalM,
  },
  fieldLabel: {
    color: tokens.colorNeutralForeground3,
    display: 'block',
    marginBottom: tokens.spacingVerticalXS,
  },
  flagItem: {
    padding: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalS,
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusMedium,
    borderLeft: `4px solid ${tokens.colorPaletteRedBorder2}`,
  },
  serviceChip: {
    marginRight: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingHorizontalS,
  },
})

interface Props {
  open: boolean
  caseResult: CaseResult | null
  onClose: () => void
}

export function CaseFormPanel({ open, caseResult, onClose }: Props) {
  const styles = useStyles()
  const [tab, setTab] = useState<TabValue>('details')

  if (!caseResult?.case_form) {
    return (
      <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
        <DialogSurface style={{ maxWidth: '600px' }}>
          <DialogTitle>Case Extraction Error</DialogTitle>
          <DialogBody className={styles.dialogBody}>
            <Card className={styles.card}>
              <Text size={400}>
                The case form could not be extracted. This might be due to:
              </Text>
              <ul style={{ marginTop: '12px' }}>
                <li>Insufficient conversation data</li>
                <li>Connection issues with the AI service</li>
                <li>Incomplete emergency call transcript</li>
              </ul>
            </Card>
          </DialogBody>
          <DialogActions>
            <Button appearance="primary" onClick={onClose}>
              Close
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    )
  }

  const form = caseResult.case_form

  const getPriorityColor = (
    p: string
  ): 'danger' | 'warning' | 'success' => {
    if (p === 'P1_critical') return 'danger'
    if (p === 'P2_urgent') return 'warning'
    return 'success'
  }

  const getSeverityColor = (
    s: string
  ): 'danger' | 'important' | 'warning' | 'success' => {
    switch (s) {
      case 'critical':
        return 'danger'
      case 'serious':
        return 'important'
      case 'moderate':
        return 'warning'
      default:
        return 'success'
    }
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface
        style={{ maxWidth: '1200px', width: '95vw', maxHeight: '90vh' }}
      >
        <DialogTitle>Emergency Case Report</DialogTitle>
        <DialogBody className={styles.dialogBody}>
          {/* Header bar with priority + services */}
          <div className={styles.headerBar}>
            <div className={styles.badgeRow}>
              <Badge
                color={getPriorityColor(form.triage.priority)}
                appearance="filled"
                size="large"
              >
                {form.triage.priority.replace('_', ' ')}
              </Badge>
              <Badge
                color={getSeverityColor(form.what.severity_estimate)}
                appearance="filled"
                size="large"
              >
                {form.what.severity_estimate.toUpperCase()}
              </Badge>
              <Badge appearance="filled" size="large">
                {form.what.emergency_type.toUpperCase()}
              </Badge>
              <Badge appearance="tint" size="large">
                Response: {form.triage.response_category}
              </Badge>
            </div>
            <ProgressBar
              value={form.completeness_score.overall_pct / 100}
              thickness="large"
            />
            <Text size={200}>
              Completeness: {form.completeness_score.overall_pct}%
            </Text>
          </div>

          <TabList
            className={styles.tabs}
            appearance="subtle"
            size="large"
            selectedValue={tab}
            onTabSelect={(_, data) => setTab(data.value)}
          >
            <Tab value="details">5W Details</Tab>
            <Tab value="triage">Triage & Dispatch</Tab>
            <Tab value="summary">Summary</Tab>
          </TabList>

          {tab === 'details' && (
            <div className={styles.tabContent}>
              <div className={styles.grid}>
                {/* WHERE */}
                <Card className={styles.card}>
                  <CardHeader
                    header={
                      <Text size={500} weight="semibold">
                        📍 Where
                      </Text>
                    }
                  />
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Address
                    </Text>
                    <Text size={400}>{form.where.address || '—'}</Text>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Floor / Level
                    </Text>
                    <Text size={300}>{form.where.floor_level || '—'}</Text>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Landmarks
                    </Text>
                    <Text size={300}>{form.where.landmarks || '—'}</Text>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Access Notes
                    </Text>
                    <Text size={300}>{form.where.access_notes || '—'}</Text>
                  </div>
                  <Badge
                    color={
                      form.where.confidence === 'high'
                        ? 'success'
                        : form.where.confidence === 'medium'
                          ? 'warning'
                          : 'danger'
                    }
                    appearance="tint"
                  >
                    Location confidence: {form.where.confidence}
                  </Badge>
                </Card>

                {/* WHAT */}
                <Card className={styles.card}>
                  <CardHeader
                    header={
                      <Text size={500} weight="semibold">
                        🔥 What
                      </Text>
                    }
                  />
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Emergency Type
                    </Text>
                    <Badge
                      appearance="filled"
                      color={getSeverityColor(form.what.severity_estimate)}
                    >
                      {form.what.emergency_type}
                    </Badge>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Description
                    </Text>
                    <Text size={300}>{form.what.description}</Text>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Severity
                    </Text>
                    <Badge
                      color={getSeverityColor(form.what.severity_estimate)}
                      appearance="filled"
                    >
                      {form.what.severity_estimate}
                    </Badge>
                  </div>
                </Card>

                {/* WHO */}
                <Card className={styles.card}>
                  <CardHeader
                    header={
                      <Text size={500} weight="semibold">
                        👤 Who
                      </Text>
                    }
                  />
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Caller Name
                    </Text>
                    <Text size={300}>{form.who.caller_name || '—'}</Text>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Phone
                    </Text>
                    <Text size={300}>{form.who.caller_phone || '—'}</Text>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Relationship
                    </Text>
                    <Text size={300}>
                      {form.who.relationship_to_emergency || '—'}
                    </Text>
                  </div>
                </Card>

                {/* HOW MANY */}
                <Card className={styles.card}>
                  <CardHeader
                    header={
                      <Text size={500} weight="semibold">
                        👥 How Many
                      </Text>
                    }
                  />
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      People Affected
                    </Text>
                    <Text size={400} weight="semibold">
                      {form.how_many.people_affected}
                    </Text>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Casualties
                    </Text>
                    <Text size={400} weight="semibold">
                      {form.how_many.casualties_count}
                    </Text>
                  </div>
                  {form.how_many.casualties_condition.length > 0 && (
                    <div className={styles.field}>
                      <Text size={200} className={styles.fieldLabel}>
                        Conditions
                      </Text>
                      {form.how_many.casualties_condition.map((c, i) => (
                        <Text key={i} size={300} block>
                          • {c}
                        </Text>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {tab === 'triage' && (
            <div className={styles.tabContent}>
              <div className={styles.grid}>
                <Card className={styles.card}>
                  <CardHeader
                    header={
                      <Text size={500} weight="semibold">
                        🚨 Triage
                      </Text>
                    }
                  />
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Priority
                    </Text>
                    <Badge
                      color={getPriorityColor(form.triage.priority)}
                      appearance="filled"
                      size="large"
                    >
                      {form.triage.priority.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Response Category
                    </Text>
                    <Text size={300}>{form.triage.response_category}</Text>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Rationale
                    </Text>
                    <Text size={300}>{form.triage.rationale}</Text>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Dispatch Services
                    </Text>
                    <div>
                      {form.triage.dispatch_services.map(s => (
                        <Badge
                          key={s}
                          appearance="filled"
                          className={styles.serviceChip}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className={styles.card}>
                  <CardHeader
                    header={
                      <Text size={500} weight="semibold">
                        ⚠️ Escalation Flags
                      </Text>
                    }
                  />
                  {form.triage.escalation_flags.length > 0 ? (
                    form.triage.escalation_flags.map((flag, i) => (
                      <div key={i} className={styles.flagItem}>
                        <Text size={300}>{flag}</Text>
                      </div>
                    ))
                  ) : (
                    <Text
                      size={300}
                      style={{ color: tokens.colorNeutralForeground3 }}
                    >
                      No escalation flags.
                    </Text>
                  )}

                  <CardHeader
                    header={
                      <Text
                        size={500}
                        weight="semibold"
                        style={{ marginTop: tokens.spacingVerticalL }}
                      >
                        ℹ️ Additional Info
                      </Text>
                    }
                  />
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Hazards
                    </Text>
                    <Text size={300}>
                      {form.additional_info.hazards || 'None reported'}
                    </Text>
                  </div>
                  <div className={styles.field}>
                    <Text size={200} className={styles.fieldLabel}>
                      Caller Emotional State
                    </Text>
                    <Text size={300}>
                      {form.additional_info.caller_emotional_state || '—'}
                    </Text>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {tab === 'summary' && (
            <div className={styles.tabContent}>
              <Card className={styles.card}>
                <CardHeader
                  header={
                    <Text size={500} weight="semibold">
                      📝 Case Summary
                    </Text>
                  }
                />
                <Text size={300} style={{ lineHeight: 1.6 }}>
                  {form.case_summary}
                </Text>
                {caseResult.case_id && (
                  <Text
                    size={200}
                    style={{
                      marginTop: tokens.spacingVerticalL,
                      color: tokens.colorNeutralForeground3,
                    }}
                    block
                  >
                    Case ID: {caseResult.case_id}
                  </Text>
                )}
              </Card>
            </div>
          )}
        </DialogBody>
        <DialogActions>
          <Button appearance="primary" onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  )
}
