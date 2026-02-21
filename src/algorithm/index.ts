import type { ScheduleConfig, GeneratedSchedule, GeneratedRound, PauseState } from '../types'
import { selectPausedPlayers, updatePauseState } from './pauseRotation'
import { formPartnerPairs } from './partnerMatching'
import { assignOpponents } from './opponentAssignment'
import { scoreArrangement } from './scoring'
import { createEmptyHistory, updateHistory } from './history'
import { PLAYERS_PER_COURT } from '../constants'

export { scoreArrangement } from './scoring'
export { computeFairnessMetrics } from './metrics'
export { createEmptyHistory, updateHistory } from './history'

/**
 * Pre-compute the full tournament schedule.
 * For each round: select pauses -> form partner pairs -> assign to courts -> update history.
 */
export function generateSchedule(config: ScheduleConfig): GeneratedSchedule {
  const { playerIds, courts, totalRounds } = config
  const effectiveCourts = Math.min(courts, Math.floor(playerIds.length / PLAYERS_PER_COURT))

  let pauseState: PauseState = {
    pauseCount: {},
    gamesPlayed: {},
    lastPausedRound: {},
  }
  for (const id of playerIds) {
    pauseState.pauseCount[id] = 0
    pauseState.gamesPlayed[id] = 0
    pauseState.lastPausedRound[id] = 0
  }

  let history = createEmptyHistory(playerIds)
  const rounds: GeneratedRound[] = []

  for (let r = 1; r <= totalRounds; r++) {
    const pausedIds = selectPausedPlayers(playerIds, effectiveCourts, r, pauseState)
    const activeIds = playerIds.filter(id => !pausedIds.includes(id))

    const pairs = formPartnerPairs(activeIds, history)
    const matches = assignOpponents(pairs, history)

    rounds.push({
      roundNumber: r,
      matches,
      pausedPlayerIds: pausedIds,
    })

    pauseState = updatePauseState(pauseState, pausedIds, activeIds, r)
    history = updateHistory(history, matches)
  }

  return { rounds }
}

/**
 * Monte Carlo: generate K random schedules, return the best-scored one.
 */
export function generateScheduleMonteCarlo(
  config: ScheduleConfig,
  iterations: number,
): GeneratedSchedule {
  // The greedy algorithm is already deterministic and good.
  // Monte Carlo shuffles the player list to explore different arrangements.
  let bestSchedule = generateSchedule(config)
  let bestCost = totalScheduleCost(bestSchedule, config.playerIds)

  for (let i = 1; i < iterations; i++) {
    const shuffled = { ...config, playerIds: shuffle([...config.playerIds]) }
    const candidate = generateSchedule(shuffled)
    const cost = totalScheduleCost(candidate, config.playerIds)
    if (cost < bestCost) {
      bestSchedule = candidate
      bestCost = cost
    }
  }

  return bestSchedule
}

/**
 * Generate additional rounds continuing from an existing schedule.
 * Rebuilds history/pause state from existing rounds, then generates more.
 */
export function generateAdditionalRounds(
  playerIds: string[],
  courts: number,
  existingRounds: GeneratedRound[],
  count: number,
): GeneratedRound[] {
  const effectiveCts = Math.min(courts, Math.floor(playerIds.length / PLAYERS_PER_COURT))

  // Rebuild pause state from existing rounds
  let pauseState: PauseState = {
    pauseCount: {},
    gamesPlayed: {},
    lastPausedRound: {},
  }
  for (const id of playerIds) {
    pauseState.pauseCount[id] = 0
    pauseState.gamesPlayed[id] = 0
    pauseState.lastPausedRound[id] = 0
  }

  let history = createEmptyHistory(playerIds)

  for (const round of existingRounds) {
    const pausedIds = round.pausedPlayerIds
    const activeIds = playerIds.filter(id => !pausedIds.includes(id))
    pauseState = updatePauseState(pauseState, pausedIds, activeIds, round.roundNumber)
    history = updateHistory(history, round.matches)
  }

  // Generate new rounds
  const startRound = existingRounds.length + 1
  const newRounds: GeneratedRound[] = []

  for (let r = startRound; r < startRound + count; r++) {
    const pausedIds = selectPausedPlayers(playerIds, effectiveCts, r, pauseState)
    const activeIds = playerIds.filter(id => !pausedIds.includes(id))

    const pairs = formPartnerPairs(activeIds, history)
    const matches = assignOpponents(pairs, history)

    newRounds.push({
      roundNumber: r,
      matches,
      pausedPlayerIds: pausedIds,
    })

    pauseState = updatePauseState(pauseState, pausedIds, activeIds, r)
    history = updateHistory(history, matches)
  }

  return newRounds
}

function totalScheduleCost(schedule: GeneratedSchedule, playerIds: string[]): number {
  let history = createEmptyHistory(playerIds)
  let cost = 0

  for (const round of schedule.rounds) {
    cost += scoreArrangement(round.matches, history)
    history = updateHistory(history, round.matches)
  }

  return cost
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
