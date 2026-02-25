import type { PlayerGroup, RegisteredPlayer, TournamentRecord, LeaderboardEntry, PlayerStats, RoundResult, ScoringMode } from '../../types'
import type { PlayerGroupState } from './actions'

// --- Phase 1: Basic lookups ---

export function getActiveGroup(state: PlayerGroupState): PlayerGroup | null {
  const id = state.index.activeGroupId
  if (!id) return null
  return state.groups[id] ?? null
}

export function getRegisteredPlayerByName(group: PlayerGroup, name: string): RegisteredPlayer | undefined {
  const lower = name.toLowerCase()
  return group.players.find(p => p.name.toLowerCase() === lower)
}

export function getNonArchivedPlayers(group: PlayerGroup): RegisteredPlayer[] {
  return group.players.filter(p => !p.archived)
}

// --- Phase 4: Stat computation ---

export interface PlayerOverviewStats {
  playerId: string
  name: string
  tournamentsPlayed: number
  totalMatches: number
  wins: number
  losses: number
  ties: number
  winRate: number
  lastActive: string | null
  archived: boolean
}

export interface PlayerDetailStats extends PlayerOverviewStats {
  pointsScored: number
  pointsConceded: number
  pointDifferential: number
  avgPointsPerMatch: number
  currentWinStreak: number
  bestWinStreak: number
  recentForm: ('W' | 'L' | 'T')[]
  bestTournamentRank: number | null
  worstTournamentRank: number | null
}

export interface PartnerStats {
  partnerId: string
  partnerName: string
  matchesTogether: number
  winsTogether: number
  winRate: number
}

export interface OpponentStats {
  opponentId: string
  opponentName: string
  matchesAgainst: number
  winsAgainst: number
  winRate: number
}

export interface TournamentHistoryEntry {
  tournamentId: string
  date: string
  name: string
  rank: number
  totalPlayers: number
  wins: number
  losses: number
  ties: number
  points: number
  excluded: boolean
}

function getIncludedTournaments(group: PlayerGroup): TournamentRecord[] {
  return group.tournamentHistory.filter(t => !t.excluded)
}

function playerInMatch(playerId: string, match: { team1: { playerIds: [string, string] }; team2: { playerIds: [string, string] } }): boolean {
  return match.team1.playerIds.includes(playerId) || match.team2.playerIds.includes(playerId)
}

function isPlayerFillIn(playerId: string, match: { fillInPlayerIds?: string[] }): boolean {
  return match.fillInPlayerIds?.includes(playerId) ?? false
}

function didPlayerWin(playerId: string, match: { team1: { playerIds: [string, string]; score: number }; team2: { playerIds: [string, string]; score: number }; winner?: 1 | 2 }): boolean | null {
  const isTeam1 = match.team1.playerIds.includes(playerId)
  if (match.winner != null) {
    return match.winner === (isTeam1 ? 1 : 2)
  }
  const myScore = isTeam1 ? match.team1.score : match.team2.score
  const theirScore = isTeam1 ? match.team2.score : match.team1.score
  if (myScore > theirScore) return true
  if (myScore < theirScore) return false
  return null
}

export function getPlayerOverviewStats(group: PlayerGroup): PlayerOverviewStats[] {
  const tournaments = getIncludedTournaments(group)
  const playerMap = new Map<string, RegisteredPlayer>()
  for (const p of group.players) playerMap.set(p.id, p)

  return group.players.map(player => {
    let tournamentsPlayed = 0
    let totalMatches = 0
    let wins = 0
    let losses = 0
    let ties = 0
    let lastActive: string | null = null

    for (const t of tournaments) {
      if (!t.playerIds.includes(player.id)) continue
      tournamentsPlayed++
      if (!lastActive || t.date > lastActive) lastActive = t.date

      for (const match of t.matches) {
        if (!playerInMatch(player.id, match)) continue
        if (isPlayerFillIn(player.id, match)) continue
        totalMatches++
        const won = didPlayerWin(player.id, match)
        if (won === true) wins++
        else if (won === false) losses++
        else if (won === null) ties++
      }
    }

    return {
      playerId: player.id,
      name: player.name,
      tournamentsPlayed,
      totalMatches,
      wins,
      losses,
      ties,
      winRate: totalMatches > 0 ? wins / totalMatches : 0,
      lastActive,
      archived: player.archived,
    }
  })
}

export function getPlayerDetailStats(group: PlayerGroup, playerId: string): PlayerDetailStats | null {
  const player = group.players.find(p => p.id === playerId)
  if (!player) return null

  const tournaments = getIncludedTournaments(group)
  let tournamentsPlayed = 0
  let totalMatches = 0
  let wins = 0
  let losses = 0
  let ties = 0
  let pointsScored = 0
  let pointsConceded = 0
  let lastActive: string | null = null
  let bestTournamentRank: number | null = null
  let worstTournamentRank: number | null = null

  const allResults: ('W' | 'L' | 'T')[] = []
  let currentWinStreak = 0
  let bestWinStreak = 0
  let streak = 0

  for (const t of tournaments) {
    if (!t.playerIds.includes(playerId)) continue
    tournamentsPlayed++
    if (!lastActive || t.date > lastActive) lastActive = t.date

    const snapshot = t.leaderboardSnapshot.find(s => s.playerId === playerId)
    if (snapshot) {
      if (bestTournamentRank === null || snapshot.rank < bestTournamentRank) bestTournamentRank = snapshot.rank
      if (worstTournamentRank === null || snapshot.rank > worstTournamentRank) worstTournamentRank = snapshot.rank
    }

    for (const match of t.matches) {
      if (!playerInMatch(playerId, match)) continue
      if (isPlayerFillIn(playerId, match)) continue
      totalMatches++

      const isTeam1 = match.team1.playerIds.includes(playerId)
      const myScore = isTeam1 ? match.team1.score : match.team2.score
      const theirScore = isTeam1 ? match.team2.score : match.team1.score
      pointsScored += myScore
      pointsConceded += theirScore

      const won = didPlayerWin(playerId, match)
      if (won === true) {
        wins++
        streak++
        if (streak > bestWinStreak) bestWinStreak = streak
        allResults.push('W')
      } else if (won === false) {
        losses++
        streak = 0
        allResults.push('L')
      } else if (won === null) {
        ties++
        streak = 0
        allResults.push('T')
      }
    }
  }

  // Current win streak: count from end of allResults
  currentWinStreak = 0
  for (let i = allResults.length - 1; i >= 0; i--) {
    if (allResults[i] === 'W') currentWinStreak++
    else break
  }

  return {
    playerId: player.id,
    name: player.name,
    tournamentsPlayed,
    totalMatches,
    wins,
    losses,
    ties,
    winRate: totalMatches > 0 ? wins / totalMatches : 0,
    lastActive,
    archived: player.archived,
    pointsScored,
    pointsConceded,
    pointDifferential: pointsScored - pointsConceded,
    avgPointsPerMatch: totalMatches > 0 ? pointsScored / totalMatches : 0,
    currentWinStreak,
    bestWinStreak,
    recentForm: allResults.slice(-10),
    bestTournamentRank,
    worstTournamentRank,
  }
}

export function getPlayerPartnerStats(group: PlayerGroup, playerId: string): PartnerStats[] {
  const tournaments = getIncludedTournaments(group)
  const playerMap = new Map<string, RegisteredPlayer>()
  for (const p of group.players) playerMap.set(p.id, p)

  const partnerData = new Map<string, { matches: number; wins: number }>()

  for (const t of tournaments) {
    for (const match of t.matches) {
      if (!playerInMatch(playerId, match)) continue
      if (isPlayerFillIn(playerId, match)) continue
      const isTeam1 = match.team1.playerIds.includes(playerId)
      const team = isTeam1 ? match.team1.playerIds : match.team2.playerIds
      const partnerId = team.find(id => id !== playerId)
      if (!partnerId) continue

      const data = partnerData.get(partnerId) ?? { matches: 0, wins: 0 }
      data.matches++
      const won = didPlayerWin(playerId, match)
      if (won === true) data.wins++
      partnerData.set(partnerId, data)
    }
  }

  return Array.from(partnerData.entries())
    .map(([partnerId, data]) => ({
      partnerId,
      partnerName: playerMap.get(partnerId)?.name ?? 'Unknown',
      matchesTogether: data.matches,
      winsTogether: data.wins,
      winRate: data.matches > 0 ? data.wins / data.matches : 0,
    }))
    .sort((a, b) => b.matchesTogether - a.matchesTogether)
}

export function getPlayerOpponentStats(group: PlayerGroup, playerId: string): OpponentStats[] {
  const tournaments = getIncludedTournaments(group)
  const playerMap = new Map<string, RegisteredPlayer>()
  for (const p of group.players) playerMap.set(p.id, p)

  const opponentData = new Map<string, { matches: number; wins: number }>()

  for (const t of tournaments) {
    for (const match of t.matches) {
      if (!playerInMatch(playerId, match)) continue
      if (isPlayerFillIn(playerId, match)) continue
      const isTeam1 = match.team1.playerIds.includes(playerId)
      const opponents = isTeam1 ? match.team2.playerIds : match.team1.playerIds

      for (const oppId of opponents) {
        const data = opponentData.get(oppId) ?? { matches: 0, wins: 0 }
        data.matches++
        const won = didPlayerWin(playerId, match)
        if (won === true) data.wins++
        opponentData.set(oppId, data)
      }
    }
  }

  return Array.from(opponentData.entries())
    .map(([opponentId, data]) => ({
      opponentId,
      opponentName: playerMap.get(opponentId)?.name ?? 'Unknown',
      matchesAgainst: data.matches,
      winsAgainst: data.wins,
      winRate: data.matches > 0 ? data.wins / data.matches : 0,
    }))
    .sort((a, b) => b.matchesAgainst - a.matchesAgainst)
}

export function getPlayerTournamentHistory(group: PlayerGroup, playerId: string): TournamentHistoryEntry[] {
  return group.tournamentHistory
    .filter(t => t.playerIds.includes(playerId))
    .map(t => {
      const snapshot = t.leaderboardSnapshot.find(s => s.playerId === playerId)
      return {
        tournamentId: t.id,
        date: t.date,
        name: t.name,
        rank: snapshot?.rank ?? 0,
        totalPlayers: t.playerIds.length,
        wins: snapshot?.wins ?? 0,
        losses: snapshot?.losses ?? 0,
        ties: snapshot?.ties ?? 0,
        points: snapshot?.points ?? 0,
        excluded: t.excluded,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

// --- Reconstruct full leaderboard from historical tournament record ---

function usesPointScoring(mode: ScoringMode): boolean {
  return mode === 'points' || mode === 'pointsToWin' || mode === 'timed'
}

export function reconstructLeaderboard(record: TournamentRecord, group: PlayerGroup): LeaderboardEntry[] {
  // Build player name map from group (fallback for deleted players)
  const playerNameMap = new Map<string, string>()
  for (const p of group.players) playerNameMap.set(p.id, p.name)

  const scoringMode = record.config.scoringMode as ScoringMode
  const pointMode = usesPointScoring(scoringMode)

  // Initialize stats per player
  const statsMap = new Map<string, PlayerStats>()
  for (const pid of record.playerIds) {
    statsMap.set(pid, {
      playerId: pid,
      playerName: playerNameMap.get(pid) ?? 'Player',
      points: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      gamesPlayed: 0,
      gamesPaused: 0,
      pointDifferential: 0,
      roundResults: [],
    })
  }

  // Group matches by round
  const matchesByRound = new Map<number, typeof record.matches>()
  for (const match of record.matches) {
    const list = matchesByRound.get(match.round) ?? []
    list.push(match)
    matchesByRound.set(match.round, list)
  }

  // Determine all round numbers
  const roundNumbers = Array.from(matchesByRound.keys()).sort((a, b) => a - b)

  for (const roundNum of roundNumbers) {
    const roundMatches = matchesByRound.get(roundNum)!

    // Find players who played this round
    const playedThisRound = new Set<string>()
    for (const match of roundMatches) {
      for (const pid of [...match.team1.playerIds, ...match.team2.playerIds]) {
        playedThisRound.add(pid)
      }
    }

    // Mark paused players
    for (const pid of record.playerIds) {
      if (!playedThisRound.has(pid)) {
        const stats = statsMap.get(pid)!
        stats.gamesPaused++
        stats.roundResults.push({ roundNumber: roundNum, paused: true })
      }
    }

    // Process each match
    for (const match of roundMatches) {
      const allIds = [...match.team1.playerIds, ...match.team2.playerIds]

      for (const pid of allIds) {
        const stats = statsMap.get(pid)!

        // Skip fill-in players in equalizer rounds
        if (match.fillInPlayerIds?.includes(pid)) {
          stats.roundResults.push({ roundNumber: roundNum, paused: false, fillIn: true })
          continue
        }

        stats.gamesPlayed++

        const isTeam1 = match.team1.playerIds.includes(pid)
        const team = isTeam1 ? match.team1.playerIds : match.team2.playerIds
        const partnerId = team.find(id => id !== pid)!
        const opponentIds: [string, string] = isTeam1
          ? [match.team2.playerIds[0], match.team2.playerIds[1]]
          : [match.team1.playerIds[0], match.team1.playerIds[1]]

        const roundResult: RoundResult = {
          roundNumber: roundNum,
          paused: false,
          courtIndex: match.court,
          partnerId,
          opponentIds,
        }

        if (pointMode) {
          const myScore = isTeam1 ? match.team1.score : match.team2.score
          const theirScore = isTeam1 ? match.team2.score : match.team1.score
          stats.points += myScore
          stats.pointDifferential += myScore - theirScore
          roundResult.pointsScored = myScore
          roundResult.pointsConceded = theirScore

          if (myScore > theirScore) {
            stats.wins++
            roundResult.won = true
          } else if (myScore < theirScore) {
            stats.losses++
            roundResult.won = false
          } else {
            stats.ties++
            roundResult.tied = true
          }
        } else {
          // Win/loss mode
          if (match.winner != null) {
            const myTeam = isTeam1 ? 1 : 2
            if (match.winner === myTeam) {
              stats.wins++
              stats.points += 1
              roundResult.won = true
            } else {
              stats.losses++
              roundResult.won = false
            }
          }
        }

        stats.roundResults.push(roundResult)
      }
    }
  }

  // Sort and rank — same logic as getLeaderboard
  const statsArray = Array.from(statsMap.values())
  statsArray.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.pointDifferential !== a.pointDifferential) return b.pointDifferential - a.pointDifferential
    return a.playerName.localeCompare(b.playerName)
  })

  return statsArray.map((s, i) => ({ ...s, rank: i + 1 }))
}
