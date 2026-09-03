/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { makeStyles, tokens } from '@fluentui/react-components'
import { ReactNode } from 'react'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    overflow: 'hidden',
  },
  half: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  divider: {
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
    flexShrink: 0,
  },
})

interface Props {
  top: ReactNode
  bottom: ReactNode
}

export function RightSplitPanel({ top, bottom }: Props) {
  const styles = useStyles()
  return (
    <div className={styles.container}>
      <div className={styles.half}>{top}</div>
      <div className={styles.divider} />
      <div className={styles.half}>{bottom}</div>
    </div>
  )
}
