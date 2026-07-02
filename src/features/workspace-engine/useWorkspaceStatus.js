import { useMemo } from 'react'

export function useWorkspaceStatus(config, state) {
  return useMemo(() => {
    const readinessItems = config.getReadinessItems(state)
    const completeItems = readinessItems.filter((item) => item.complete)
    const missingSteps = readinessItems.filter((item) => !item.complete)
    const readinessPercentage = readinessItems.length
      ? Math.round((completeItems.length / readinessItems.length) * 100)
      : 0

    return {
      readinessItems,
      readinessPercentage,
      missingSteps,
      canGenerate: config.canGenerate(state),
    }
  }, [config, state])
}
