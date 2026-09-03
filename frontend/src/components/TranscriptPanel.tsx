/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Badge,
    Button,
    Input,
    Text,
    makeStyles,
    tokens,
} from '@fluentui/react-components'
import { SendRegular } from '@fluentui/react-icons'
import { useEffect, useRef, useState } from 'react'
import { Message } from '../types'

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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  bubble: {
    maxWidth: '75%',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusLarge,
    wordBreak: 'break-word',
  },
  caller: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  operator: {
    alignSelf: 'flex-end',
    backgroundColor: tokens.colorBrandBackground2,
  },
  systemEvent: {
    alignSelf: 'center',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontStyle: 'italic',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
  },
  bubbleRole: {
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalXXS,
    display: 'block',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3,
    gap: tokens.spacingVerticalS,
  },
  typingBubble: {
    alignSelf: 'flex-start',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  typingDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: tokens.colorNeutralForeground3,
    animationName: {
      '0%, 60%, 100%': { opacity: 0.25 },
      '30%': { opacity: 1 },
    },
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
  },
  composer: {
    padding: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
  composerInput: {
    flex: 1,
  },
})

export type CallPhase = 'idle' | 'ringing' | 'active' | 'ended'

interface Props {
  messages: Message[]
  phase?: CallPhase
  callerName?: string
  typing?: boolean
}

export function TranscriptPanel({
  messages,
  phase = 'idle',
  callerName,
  typing = false,
}: Props) {
  const styles = useStyles()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [stickToBottom, setStickToBottom] = useState(true)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setStickToBottom(distanceFromBottom < 40)
  }

  useEffect(() => {
    if (!stickToBottom) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, typing, stickToBottom])

  const phaseBadge = (() => {
    switch (phase) {
      case 'ringing':
        return <Badge color="warning">Ringing</Badge>
      case 'active':
        return <Badge color="success">Active</Badge>
      case 'ended':
        return <Badge color="subtle">Ended</Badge>
      default:
        return <Badge color="informative">Idle</Badge>
    }
  })()

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Text size={500} weight="semibold">
          Messages {callerName && `— ${callerName}`}
        </Text>
        {phaseBadge}
      </div>

      <div
        className={styles.scrollArea}
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 && !typing ? (
          <div className={styles.emptyState}>
            <Text size={300}>
              {phase === 'ringing' ? 'Connecting…' : 'Waiting for caller…'}
            </Text>
          </div>
        ) : (
          <>
            {messages.map(msg => {
              if (msg.role === 'system') {
                return (
                  <div key={msg.id} className={styles.systemEvent}>
                    — {msg.content} —
                  </div>
                )
              }
              return (
                <div
                  key={msg.id}
                  className={`${styles.bubble} ${
                    msg.role === 'user' ? styles.caller : styles.operator
                  }`}
                >
                  <Text size={100} className={styles.bubbleRole}>
                    {msg.role === 'user' ? 'Caller' : 'Operator'}
                  </Text>
                  <Text size={300}>{msg.content}</Text>
                </div>
              )
            })}
            {typing && (
              <div
                className={styles.typingBubble}
                aria-label="Caller is typing"
              >
                <span
                  className={styles.typingDot}
                  style={{ animationDelay: '0s' }}
                />
                <span
                  className={styles.typingDot}
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className={styles.typingDot}
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.composer}>
        <Input
          className={styles.composerInput}
          placeholder="Type something here…"
          disabled
        />
        <Button icon={<SendRegular />} appearance="primary" disabled />
      </div>
    </div>
  )
}
