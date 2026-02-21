import type { PauseState } from '../types'
import { PLAYERS_PER_COURT } from '../constants'

/**
 * Select which players sit out this round.
 * Priority: ascending pause count -> descending games played -> ascending last-paused-round -> stable ID sort
 */
export function selectPausedPlayers(
  playerIds: string[],
  courts: number,
  _roundNumber: number,
  pauseState: PauseState,
): string[] {
  const activeSlots = courts * PLAYERS_PER_COURT
  const pauseCount = playerIds.length - activeSlots

  if (pauseCount <= 0) return []

  const sorted = [...playerIds].sort((a, b) => {
    // 1. Fewest pauses first (they should pause next)
    const pa = pauseState.pauseCount[a] ?? 0
    const pb = pauseState.pauseCount[b] ?? 0
    if (pa !== pb) return pa - pb

    // 2. Most games played first (give them a break)
    const ga = pauseState.gamesPlayed[a] ?? 0
    const gb = pauseState.gamesPlayed[b] ?? 0
    if (ga !== gb) return gb - ga

    // 3. Longest since last pause first (they're "due" for a pause)
    const la = pauseState.lastPausedRound[a] ?? 0
    const lb = pauseState.lastPausedRound[b] ?? 0
    if (la !== lb) return la - lb

    // 4. Deterministic tiebreaker
    return a.localeCompare(b)
  })

  return sorted.slice(0, pauseCount)
}

export function updatePauseState(
  pauseState: PauseState,
  pausedIds: string[],
  activeIds: string[],
  roundNumber: number,
): PauseState {
  const newPauseCount = { ...pauseState.pauseCount }
  const newGamesPlayed = { ...pauseState.gamesPlayed }
  const newLastPaused = { ...pauseState.lastPausedRound }

  for (const id of pausedIds) {
    newPauseCount[id] = (newPauseCount[id] ?? 0) + 1
    newLastPaused[id] = roundNumber
  }

  for (const id of activeIds) {
    newGamesPlayed[id] = (newGamesPlayed[id] ?? 0) + 1
  }

  return {
    pauseCount: newPauseCount,
    gamesPlayed: newGamesPlayed,
    lastPausedRound: newLastPaused,
  }
}
