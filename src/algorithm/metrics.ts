import type { GeneratedSchedule, FairnessMetrics } from '../types'

export function computeFairnessMetrics(
  schedule: GeneratedSchedule,
  playerIds: string[],
): FairnessMetrics {
  const n = playerIds.length
  const idIndex = new Map(playerIds.map((id, i) => [id, i]))

  // Track per-player stats
  const gamesPlayed = new Array(n).fill(0)
  const pauseCount = new Array(n).fill(0)

  // NxN matrices
  const partnerMatrix = Array.from({ length: n }, () => new Array(n).fill(0))
  const opponentMatrix = Array.from({ length: n }, () => new Array(n).fill(0))

  for (const round of schedule.rounds) {
    for (const pid of round.pausedPlayerIds) {
      const i = idIndex.get(pid)!
      pauseCount[i]++
    }

    for (const match of round.matches) {
      const allPlayers = [...match.team1, ...match.team2]
      for (const pid of allPlayers) {
        gamesPlayed[idIndex.get(pid)!]++
      }

      // Partner counts
      const [t1a, t1b] = match.team1.map(id => idIndex.get(id)!)
      const [t2a, t2b] = match.team2.map(id => idIndex.get(id)!)
      partnerMatrix[t1a][t1b]++
      partnerMatrix[t1b][t1a]++
      partnerMatrix[t2a][t2b]++
      partnerMatrix[t2b][t2a]++

      // Opponent counts
      for (const a of match.team1) {
        for (const b of match.team2) {
          const ai = idIndex.get(a)!
          const bi = idIndex.get(b)!
          opponentMatrix[ai][bi]++
          opponentMatrix[bi][ai]++
        }
      }
    }
  }

  const gamesStdDev = stdDev(gamesPlayed)
  const pauseStdDev = stdDev(pauseCount)
  const maxGamesGap = Math.max(...gamesPlayed) - Math.min(...gamesPlayed)
  const maxPauseGap = Math.max(...pauseCount) - Math.min(...pauseCount)

  // Partner variety index: how evenly distributed are partnerships?
  const partnerVarietyIndex = varietyIndex(partnerMatrix, n)
  const opponentVarietyIndex = varietyIndex(opponentMatrix, n)

  // Compute max gap (spread) across all pair counts
  const partnerValues: number[] = []
  const opponentValues: number[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      partnerValues.push(partnerMatrix[i][j])
      opponentValues.push(opponentMatrix[i][j])
    }
  }
  const maxPartnerGap = partnerValues.length > 0 ? Math.max(...partnerValues) - Math.min(...partnerValues) : 0
  const maxOpponentGap = opponentValues.length > 0 ? Math.max(...opponentValues) - Math.min(...opponentValues) : 0

  return {
    gamesPlayedStdDev: gamesStdDev,
    pauseCountStdDev: pauseStdDev,
    maxPauseGap,
    maxGamesGap,
    partnerVarietyIndex,
    opponentVarietyIndex,
    maxPartnerGap,
    maxOpponentGap,
  }
}

export function buildMatrices(
  schedule: GeneratedSchedule,
  playerIds: string[],
): { partnerMatrix: number[][]; opponentMatrix: number[][] } {
  const n = playerIds.length
  const idIndex = new Map(playerIds.map((id, i) => [id, i]))
  const partnerMatrix = Array.from({ length: n }, () => new Array(n).fill(0))
  const opponentMatrix = Array.from({ length: n }, () => new Array(n).fill(0))

  for (const round of schedule.rounds) {
    for (const match of round.matches) {
      const [t1a, t1b] = match.team1.map(id => idIndex.get(id)!)
      const [t2a, t2b] = match.team2.map(id => idIndex.get(id)!)
      partnerMatrix[t1a][t1b]++
      partnerMatrix[t1b][t1a]++
      partnerMatrix[t2a][t2b]++
      partnerMatrix[t2b][t2a]++

      for (const a of match.team1) {
        for (const b of match.team2) {
          const ai = idIndex.get(a)!
          const bi = idIndex.get(b)!
          opponentMatrix[ai][bi]++
          opponentMatrix[bi][ai]++
        }
      }
    }
  }

  return { partnerMatrix, opponentMatrix }
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/**
 * Variety index: 1 = perfectly even distribution, 0 = maximally uneven.
 * Based on how evenly the upper-triangle values are distributed.
 */
function varietyIndex(matrix: number[][], n: number): number {
  const values: number[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      values.push(matrix[i][j])
    }
  }
  if (values.length === 0) return 1

  const total = values.reduce((a, b) => a + b, 0)
  if (total === 0) return 1

  const ideal = total / values.length
  const maxDeviation = total // worst case: all in one cell
  const actualDeviation = values.reduce((sum, v) => sum + Math.abs(v - ideal), 0)

  return 1 - actualDeviation / maxDeviation
}
