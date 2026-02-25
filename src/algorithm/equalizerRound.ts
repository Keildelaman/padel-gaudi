import type { Tournament, Round } from '../types'
import { PLAYERS_PER_COURT } from '../constants'
import { createEmptyHistory, updateHistory } from './history'
import { formPartnerPairs } from './partnerMatching'
import { assignOpponents } from './opponentAssignment'

export interface GamesGapInfo {
  behindPlayerIds: string[]
  maxGames: number
  minGames: number
  equalizerRoundsNeeded: number
}

/**
 * Detect whether any players have fewer games than others.
 * Returns gap info or null if everyone has equal games.
 * Skips fill-in appearances in equalizer rounds.
 */
export function detectGamesGap(tournament: Tournament): GamesGapInfo | null {
  const gamesPlayed: Record<string, number> = {}
  for (const p of tournament.players) {
    gamesPlayed[p.id] = 0
  }

  const playedRounds = tournament.rounds.filter(r => r.roundNumber <= tournament.currentRound)
  for (const round of playedRounds) {
    const fillIns = new Set(round.fillInPlayerIds ?? [])
    for (const match of round.matches) {
      for (const pid of [...match.team1, ...match.team2]) {
        // Skip fill-in players in equalizer rounds — their game doesn't count
        if (round.isEqualizerRound && fillIns.has(pid)) continue
        if (gamesPlayed[pid] != null) {
          gamesPlayed[pid]++
        }
      }
    }
  }

  const counts = Object.values(gamesPlayed)
  const maxGames = Math.max(...counts)
  const minGames = Math.min(...counts)

  if (maxGames === minGames) return null

  const behindPlayerIds = tournament.players
    .filter(p => gamesPlayed[p.id] < maxGames)
    .map(p => p.id)

  const effectiveCourts = Math.min(tournament.courts, Math.floor(tournament.players.length / PLAYERS_PER_COURT))
  const slotsPerRound = effectiveCourts * PLAYERS_PER_COURT
  const equalizerRoundsNeeded = Math.ceil(behindPlayerIds.length / slotsPerRound)

  return { behindPlayerIds, maxGames, minGames, equalizerRoundsNeeded }
}

/**
 * Generate one equalizer round.
 * Places behind players on courts, fills remaining slots with fill-in volunteers.
 * Fill-ins are selected to maximize partner/opponent variety with the behind players.
 */
export function generateEqualizerRound(tournament: Tournament): Round {
  const gap = detectGamesGap(tournament)
  if (!gap) throw new Error('No games gap detected')

  const playerIds = tournament.players.map(p => p.id)
  const effectiveCourts = Math.min(tournament.courts, Math.floor(playerIds.length / PLAYERS_PER_COURT))
  const slotsPerRound = effectiveCourts * PLAYERS_PER_COURT

  // Build match history from all existing rounds
  let history = createEmptyHistory(playerIds)
  const playedRounds = tournament.rounds.filter(r => r.roundNumber <= tournament.currentRound)
  for (const round of playedRounds) {
    const generatedMatches = round.matches.map(m => ({
      courtIndex: m.courtIndex,
      team1: m.team1,
      team2: m.team2,
    }))
    history = updateHistory(history, generatedMatches)
  }

  // Build pause state to prioritize behind players
  const pauseCount: Record<string, number> = {}
  const gamesPlayed: Record<string, number> = {}
  for (const p of tournament.players) {
    pauseCount[p.id] = 0
    gamesPlayed[p.id] = 0
  }
  for (const round of playedRounds) {
    const fillIns = new Set(round.fillInPlayerIds ?? [])
    for (const pid of round.pausedPlayerIds) {
      pauseCount[pid] = (pauseCount[pid] ?? 0) + 1
    }
    for (const match of round.matches) {
      for (const pid of [...match.team1, ...match.team2]) {
        if (round.isEqualizerRound && fillIns.has(pid)) continue
        if (gamesPlayed[pid] != null) {
          gamesPlayed[pid]++
        }
      }
    }
  }

  // Select behind players for this round (prioritize most paused, then fewest games)
  let behindPlayers = [...gap.behindPlayerIds]
  if (behindPlayers.length > slotsPerRound) {
    behindPlayers.sort((a, b) => {
      const pa = pauseCount[a] ?? 0
      const pb = pauseCount[b] ?? 0
      if (pa !== pb) return pb - pa // most paused first
      const ga = gamesPlayed[a] ?? 0
      const gb = gamesPlayed[b] ?? 0
      if (ga !== gb) return ga - gb // fewest games first
      return a.localeCompare(b)
    })
    behindPlayers = behindPlayers.slice(0, slotsPerRound)
  }

  // Select fill-in players for remaining slots
  const behindSet = new Set(behindPlayers)
  const fillInCandidates = playerIds.filter(id => !behindSet.has(id))
  const fillInCount = slotsPerRound - behindPlayers.length
  let fillInPlayerIds: string[] = []

  if (fillInCount > 0 && fillInCandidates.length > 0) {
    // Score fill-in candidates by overlap with behind players (lower = better variety)
    const scored = fillInCandidates.map(candidateId => {
      let overlap = 0
      for (const behindId of behindPlayers) {
        overlap += history.partnerCount[candidateId]?.[behindId] ?? 0
        overlap += history.opponentCount[candidateId]?.[behindId] ?? 0
      }
      return { id: candidateId, overlap }
    })

    // Sort by least overlap, with random tiebreaker
    scored.sort((a, b) => {
      if (a.overlap !== b.overlap) return a.overlap - b.overlap
      return Math.random() - 0.5
    })

    fillInPlayerIds = scored.slice(0, fillInCount).map(s => s.id)
  }

  // Combine all active players and generate matches
  const activePlayers = [...behindPlayers, ...fillInPlayerIds]
  const pairs = formPartnerPairs(activePlayers, history, true)
  const matches = assignOpponents(pairs, history, true)

  // Players not playing in this equalizer round
  const activeSet = new Set(activePlayers)
  const pausedPlayerIds = playerIds.filter(id => !activeSet.has(id))

  const roundNumber = tournament.rounds.length + 1

  return {
    roundNumber,
    matches,
    pausedPlayerIds,
    completed: false,
    isEqualizerRound: true,
    fillInPlayerIds,
  }
}
