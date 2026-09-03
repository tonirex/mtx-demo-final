/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Button,
    Input,
    Tab,
    TabList,
    Text,
    Textarea,
    Tooltip,
    makeStyles,
    tokens,
} from '@fluentui/react-components'
import {
    AddRegular,
    ArrowDownRegular,
    ArrowUndoRegular,
    ArrowUpRegular,
    BotSparkleRegular,
    CheckmarkCircleFilled,
    DismissRegular,
    EditRegular,
    HistoryRegular,
    SaveRegular,
    SendRegular,
} from '@fluentui/react-icons'
import { useEffect, useRef } from 'react'
import {
    REQUIRED_SECTIONS,
    SECTION_LABELS,
    SectionKey,
    useEditableDispatchSummary,
} from '../hooks/useEditableDispatchSummary'
import { DispatchSummary } from '../types'

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },
  tabsRow: {
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  tabsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  overrideCaption: {
    color: tokens.colorPaletteDarkOrangeForeground1,
    fontStyle: 'italic',
  },
  aiBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorBrandForeground1,
  },
  headerActions: {
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  sectionTitle: {
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  required: {
    color: tokens.colorPaletteRedForeground1,
  },
  bullet: {
    paddingLeft: tokens.spacingHorizontalM,
    position: 'relative',
    '&::before': {
      content: '"•"',
      position: 'absolute',
      left: 0,
      color: tokens.colorBrandForeground1,
    },
  },
  bulletEdited: {
    paddingLeft: tokens.spacingHorizontalM,
    borderLeft: `3px solid ${tokens.colorPaletteDarkOrangeBorder1}`,
    position: 'relative',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalXS,
  },
  editedCaption: {
    color: tokens.colorPaletteDarkOrangeForeground1,
    fontStyle: 'italic',
    marginTop: '2px',
  },
  editRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalXS,
  },
  editInput: {
    flex: 1,
  },
  rowActions: {
    display: 'flex',
    flexDirection: 'row',
    gap: '2px',
  },
  addBtn: {
    alignSelf: 'flex-start',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    padding: tokens.spacingHorizontalL,
  },
  shimmer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '80%',
  },
  shimmerLine: {
    height: '14px',
    borderRadius: tokens.borderRadiusSmall,
    background: `linear-gradient(90deg, ${tokens.colorNeutralBackground3} 0%, ${tokens.colorNeutralBackground5} 50%, ${tokens.colorNeutralBackground3} 100%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmerSlide 1.4s ease-in-out infinite',
  },
  generatingLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
  footer: {
    padding: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
    gap: tokens.spacingHorizontalS,
  },
  footerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  auditCaption: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
  validationHint: {
    color: tokens.colorPaletteRedForeground1,
  },
  dispatchBtn: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': {
      backgroundColor: tokens.colorPaletteRedBackground3,
    },
  },
})

interface Props {
  summary: DispatchSummary | null
  loading?: boolean
  dispatched?: boolean
  /** Called with the operator-edited summary when Dispatch is pressed. */
  onDispatch?: (final: DispatchSummary) => void
}

export function DispatchSummaryPanel({
  summary: aiDraft,
  loading,
  dispatched,
  onDispatch,
}: Props) {
  const styles = useStyles()
  const editor = useEditableDispatchSummary(aiDraft)
  const firstBulletRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  // Focus first bullet on entering edit mode
  useEffect(() => {
    if (editor.editing) {
      firstBulletRef.current?.focus()
    }
  }, [editor.editing])

  // Esc cancels edit mode
  useEffect(() => {
    if (!editor.editing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') editor.cancelEdit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.editing])

  const renderHeader = () => (
    <div className={styles.tabsRow}>
      <div className={styles.tabsLeft}>
        <TabList
          selectedValue={editor.activeTab}
          onTabSelect={(_, data) =>
            editor.setTab(data.value as DispatchSummary['recommended_tab'])
          }
          size="small"
        >
          <Tab value="FIRE">FIRE</Tab>
          <Tab value="POLICE">POLICE</Tab>
          <Tab value="MEDICAL">MEDICAL ASSISTANCE</Tab>
        </TabList>
        {editor.tabIsOverridden && aiDraft && (
          <Text size={100} className={styles.overrideCaption}>
            Overriding AI recommendation: {aiDraft.recommended_tab}
          </Text>
        )}
      </div>
      <div className={styles.headerActions}>
        <div className={styles.aiBadge}>
          <BotSparkleRegular />
          <Text size={100} weight="semibold">
            AI generated
          </Text>
        </div>
        {!editor.editing && editor.summary && !dispatched && (
          <Tooltip content="Edit summary" relationship="label">
            <Button
              appearance="subtle"
              icon={<EditRegular />}
              size="small"
              onClick={editor.enterEdit}
              aria-label="Edit summary"
            />
          </Tooltip>
        )}
        {editor.editing && (
          <Tooltip content="Revert all to AI draft" relationship="label">
            <Button
              appearance="subtle"
              icon={<HistoryRegular />}
              size="small"
              onClick={editor.revertAll}
              aria-label="Revert all to AI draft"
            />
          </Tooltip>
        )}
      </div>
    </div>
  )

  if (!aiDraft || loading) {
    return (
      <div className={styles.panel}>
        {renderHeader()}
        <div className={styles.emptyState}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <div className={styles.generatingLabel}>
                <BotSparkleRegular />
                <Text size={300} weight="semibold">
                  AI generating dispatch summary…
                </Text>
              </div>
              <div className={styles.shimmer}>
                <div className={styles.shimmerLine} style={{ width: '60%' }} />
                <div className={styles.shimmerLine} />
                <div className={styles.shimmerLine} style={{ width: '85%' }} />
                <div className={styles.shimmerLine} style={{ width: '70%' }} />
              </div>
            </div>
          ) : (
            <Text size={300}>
              Summary will appear once enough context is captured.
            </Text>
          )}
        </div>
      </div>
    )
  }

  const summary = editor.summary

  // Defensive: if the summary is somehow still unavailable (e.g. a one-render
  // sync gap after aiDraft arrives), fall back to the loading state rather
  // than crashing on summary[section].
  if (!summary) {
    return (
      <div className={styles.panel}>
        {renderHeader()}
        <div className={styles.emptyState}>
          <Text size={300}>Preparing summary…</Text>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      {renderHeader()}

      <div className={styles.scrollArea}>
        {(Object.keys(SECTION_LABELS) as SectionKey[]).map(section => (
          <SectionView
            key={section}
            section={section}
            items={summary[section]}
            editing={editor.editing}
            editedKeys={editor.editedKeys}
            firstBulletRef={
              section === 'location' ? firstBulletRef : undefined
            }
            onChange={(idx, value) =>
              editor.updateBullet(section, idx, value)
            }
            onAdd={() => editor.addBullet(section)}
            onRemove={idx => editor.removeBullet(section, idx)}
            onMove={(idx, dir) => editor.moveBullet(section, idx, dir)}
            onRevert={idx => editor.revertBullet(section, idx)}
            styles={styles}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <div>
          {editor.editing && !editor.validation.valid && (
            <Text size={100} className={styles.validationHint}>
              Required:{' '}
              {editor.validation.missing
                .map(s => SECTION_LABELS[s])
                .join(', ')}
            </Text>
          )}
          {!editor.editing && editor.lastEditedAt && (
            <Text size={100} className={styles.auditCaption}>
              Last edited by operator · {formatTime(editor.lastEditedAt)}
            </Text>
          )}
        </div>
        <div className={styles.footerActions}>
          {editor.editing ? (
            <>
              <Button
                appearance="secondary"
                icon={<DismissRegular />}
                onClick={editor.cancelEdit}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                icon={<SaveRegular />}
                onClick={editor.saveEdit}
                disabled={!editor.validation.valid}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              appearance="primary"
              icon={dispatched ? <CheckmarkCircleFilled /> : <SendRegular />}
              onClick={() => {
                if (editor.finalSummary)
                  onDispatch?.(editor.finalSummary)
              }}
              disabled={!editor.finalSummary || dispatched}
              className={styles.dispatchBtn}
            >
              {dispatched ? 'Dispatched' : 'Dispatch'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface SectionViewProps {
  section: SectionKey
  items: string[]
  editing: boolean
  editedKeys: Set<string>
  onChange: (idx: number, value: string) => void
  onAdd: () => void
  onRemove: (idx: number) => void
  onMove: (idx: number, dir: -1 | 1) => void
  onRevert: (idx: number) => void
  styles: ReturnType<typeof useStyles>
  firstBulletRef?: React.MutableRefObject<
    HTMLInputElement | HTMLTextAreaElement | null
  >
}

function SectionView({
  section,
  items,
  editing,
  editedKeys,
  onChange,
  onAdd,
  onRemove,
  onMove,
  onRevert,
  styles,
  firstBulletRef,
}: SectionViewProps) {
  const isRequired = REQUIRED_SECTIONS.includes(section)
  const isMultiline = section === 'notes'

  return (
    <div className={styles.section}>
      <Text size={200} weight="semibold" className={styles.sectionTitle}>
        {SECTION_LABELS[section]}
        {isRequired && editing && (
          <span className={styles.required} title="Required section">
            *
          </span>
        )}
      </Text>

      {items.map((it, i) => {
        const edited = editedKeys.has(`${section}.${i}`)
        if (editing) {
          return (
            <div key={i} className={styles.editRow}>
              {isMultiline ? (
                <Textarea
                  ref={
                    i === 0 && firstBulletRef
                      ? (firstBulletRef as React.RefObject<HTMLTextAreaElement>)
                      : undefined
                  }
                  className={styles.editInput}
                  value={it}
                  rows={2}
                  onChange={(_, data) => onChange(i, data.value)}
                />
              ) : (
                <Input
                  ref={
                    i === 0 && firstBulletRef
                      ? (firstBulletRef as React.RefObject<HTMLInputElement>)
                      : undefined
                  }
                  className={styles.editInput}
                  value={it}
                  onChange={(_, data) => onChange(i, data.value)}
                />
              )}
              <div className={styles.rowActions}>
                <Tooltip content="Move up" relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowUpRegular />}
                    onClick={() => onMove(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                  />
                </Tooltip>
                <Tooltip content="Move down" relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowDownRegular />}
                    onClick={() => onMove(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move down"
                  />
                </Tooltip>
                <Tooltip content="Revert this bullet" relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowUndoRegular />}
                    onClick={() => onRevert(i)}
                    aria-label="Revert this bullet"
                  />
                </Tooltip>
                <Tooltip content="Remove" relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<DismissRegular />}
                    onClick={() => onRemove(i)}
                    aria-label="Remove"
                  />
                </Tooltip>
              </div>
            </div>
          )
        }
        return (
          <div key={i} className={edited ? styles.bulletEdited : styles.bullet}>
            <Text size={300}>{it}</Text>
            {edited && (
              <Text size={100} className={styles.editedCaption}>
                edited
              </Text>
            )}
          </div>
        )
      })}

      {editing && (
        <Button
          appearance="subtle"
          size="small"
          icon={<AddRegular />}
          onClick={onAdd}
          className={styles.addBtn}
        >
          Add bullet
        </Button>
      )}
    </div>
  )
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
