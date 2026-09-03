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
import { BotSparkleRegular, SendRegular, SparkleRegular } from '@fluentui/react-icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { KnowledgeMessage, KnowledgeQAEntry } from '../types'
import { FALLBACK_ANSWER, matchKnowledge } from '../utils/knowledgeMatcher'

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },
  header: {
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
  aiAccent: {
    color: tokens.colorBrandForeground1,
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  message: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  operatorMsg: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: tokens.colorBrandBackground2,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusLarge,
  },
  assistantMsg: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusLarge,
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
  },
  assistantHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXXS,
  },
  sources: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  cursor: {
    display: 'inline-block',
    width: '6px',
    backgroundColor: tokens.colorBrandForeground1,
    animation: 'blink 1s steps(2, start) infinite',
    marginLeft: '2px',
  },
  suggestions: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    paddingTop: tokens.spacingVerticalS,
  },
  suggestionsLabel: {
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  suggestionChip: {
    justifyContent: 'flex-start',
    textAlign: 'left',
  },
  composer: {
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
  composerInput: {
    flex: 1,
  },
  disclosure: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground2,
    fontSize: tokens.fontSizeBase100,
    flexShrink: 0,
  },
})

interface Props {
  /** Initial seed messages (typically a single greeting). */
  messages: KnowledgeMessage[]
  /** Suggested prompts shown below the greeting. */
  suggestions?: string[]
  /** QA pool the matcher uses; required for the composer to work. */
  qa?: KnowledgeQAEntry[]
  /** Reset signal — when this value changes the chat is reset to seed. */
  resetKey?: string
  /** Characters per second for streamed answers. */
  streamCps?: number
}

interface AssistantStream {
  id: string
  full: string
  shown: number
  sources?: string[]
}

export function KnowledgeChatPanel({
  messages: seed,
  suggestions = [],
  qa = [],
  resetKey,
  streamCps = 60,
}: Props) {
  const styles = useStyles()
  const [history, setHistory] = useState<KnowledgeMessage[]>(seed)
  const [stream, setStream] = useState<AssistantStream | null>(null)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)
  const seqRef = useRef(0)

  // Reset whenever the parent passes a new resetKey (e.g. scenario change)
  useEffect(() => {
    setHistory(seed)
    setStream(null)
    setDraft('')
    seqRef.current = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  // Auto-stick to bottom unless user scrolled up
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (stickRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [history, stream])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  // Stream the active answer character-by-character
  useEffect(() => {
    if (!stream) return
    if (stream.shown >= stream.full.length) {
      // Commit completed stream into history
      const completed: KnowledgeMessage = {
        id: stream.id,
        role: 'assistant',
        content: stream.full,
        sources: stream.sources,
      }
      setHistory(h => [...h, completed])
      setStream(null)
      return
    }
    const interval = Math.max(8, Math.floor(1000 / streamCps))
    const t = setTimeout(() => {
      setStream(s => (s ? { ...s, shown: s.shown + 1 } : s))
    }, interval)
    return () => clearTimeout(t)
  }, [stream, streamCps])

  const submitting = stream !== null

  const askQuestion = (text: string) => {
    if (!text.trim() || submitting) return
    const opMsg: KnowledgeMessage = {
      id: `op-${seqRef.current++}`,
      role: 'operator',
      content: text.trim(),
    }
    setHistory(h => [...h, opMsg])
    setDraft('')
    stickRef.current = true

    const hit = matchKnowledge(text, qa)
    setStream({
      id: `as-${seqRef.current++}`,
      full: hit?.answer ?? FALLBACK_ANSWER,
      shown: 0,
      sources: hit?.sources,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      askQuestion(draft)
    }
  }

  const showSuggestions = useMemo(
    () =>
      suggestions.length > 0 &&
      history.filter(m => m.role === 'operator').length === 0 &&
      !stream,
    [suggestions, history, stream]
  )

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <BotSparkleRegular className={styles.aiAccent} />
        <Text size={400} weight="semibold">
          Chat with knowledge base
        </Text>
      </div>

      <div className={styles.scrollArea} ref={scrollRef} onScroll={onScroll}>
        {history.map(msg =>
          msg.role === 'operator' ? (
            <div key={msg.id} className={styles.message}>
              <div className={styles.operatorMsg}>
                <Text size={300}>{msg.content}</Text>
              </div>
            </div>
          ) : (
            <AssistantBubble
              key={msg.id}
              styles={styles}
              content={msg.content}
              sources={msg.sources}
            />
          )
        )}

        {stream && (
          <AssistantBubble
            styles={styles}
            content={stream.full.slice(0, stream.shown)}
            sources={
              stream.shown >= stream.full.length ? stream.sources : undefined
            }
            streaming
          />
        )}

        {showSuggestions && (
          <div className={styles.suggestions}>
            <Text size={200} weight="semibold" className={styles.suggestionsLabel}>
              Suggested prompts
            </Text>
            {suggestions.map(s => (
              <Button
                key={s}
                appearance="outline"
                icon={<SparkleRegular />}
                className={styles.suggestionChip}
                onClick={() => askQuestion(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.disclosure}>
        AI-generated content may be incorrect. Verify before acting.
      </div>

      <div className={styles.composer}>
        <Input
          className={styles.composerInput}
          placeholder="Ask about an SOP…"
          value={draft}
          onChange={(_, data) => setDraft(data.value)}
          onKeyDown={handleKeyDown}
          disabled={submitting}
        />
        <Button
          icon={<SendRegular />}
          appearance="primary"
          onClick={() => askQuestion(draft)}
          disabled={submitting || !draft.trim()}
        />
      </div>
    </div>
  )
}

interface AssistantBubbleProps {
  styles: ReturnType<typeof useStyles>
  content: string
  sources?: string[]
  streaming?: boolean
}

function AssistantBubble({
  styles,
  content,
  sources,
  streaming,
}: AssistantBubbleProps) {
  return (
    <div className={styles.message}>
      <div className={styles.assistantMsg}>
        <div className={styles.assistantHeader}>
          <BotSparkleRegular />
          <Text size={100} weight="semibold">
            AI generated
          </Text>
        </div>
        <Text size={300}>
          {content}
          {streaming && <span className={styles.cursor}>&nbsp;</span>}
        </Text>
        {sources && sources.length > 0 && (
          <div className={styles.sources}>
            {sources.map(s => (
              <Badge key={s} appearance="outline" size="small">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
