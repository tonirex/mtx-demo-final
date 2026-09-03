/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Badge,
    Button,
    Card,
    CardHeader,
    Text,
    makeStyles,
    tokens,
} from '@fluentui/react-components'
import { Scenario } from '../types'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
  },
  header: {
    gridColumn: '1 / -1',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingVerticalM,
    gridColumn: '1 / span 2',
    width: '100%',
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow16,
    },
  },
  selected: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  actions: {
    gridColumn: '1 / -1',
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: tokens.spacingVerticalL,
  },
})

interface Props {
  scenarios: Scenario[]
  selectedScenario: string | null
  onSelect: (id: string) => void
  onStart: () => void
}

export function ScenarioList({
  scenarios,
  selectedScenario,
  onSelect,
  onStart,
}: Props) {
  const styles = useStyles()

  return (
    <>
      <Text className={styles.header} size={500} weight="semibold">
        Select Emergency Scenario
      </Text>
      <div className={styles.cardsGrid}>
        {scenarios.map(scenario => {
          const isSelected = selectedScenario === scenario.id
          return (
            <Card
              key={scenario.id}
              className={`${styles.card} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelect(scenario.id)}
            >
              <CardHeader
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                    <Text weight="semibold">{scenario.name}</Text>
                    {scenario.kind === 'video' && (
                      <Badge appearance="tint" color="informative" size="small">
                        Video
                      </Badge>
                    )}
                    {scenario.is_demo && (
                      <Badge appearance="tint" color="brand" size="small">
                        Demo
                      </Badge>
                    )}
                  </div>
                }
                description={<Text size={200}>{scenario.description}</Text>}
              />
            </Card>
          )
        })}
      </div>
      <div className={styles.actions}>
        <Button
          appearance="primary"
          disabled={!selectedScenario}
          onClick={onStart}
          size="large"
        >
          {scenarios.find(s => s.id === selectedScenario)?.is_demo
            ? 'View Demo Call'
            : 'Start Emergency Call'}
        </Button>
      </div>
    </>
  )
}
