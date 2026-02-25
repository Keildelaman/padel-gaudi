import type { Tournament, LeaderboardEntry, TournamentRecord, MatchRecord } from '../../types'

export function buildTournamentRecord(tournament: Tournament, leaderboard: LeaderboardEntry[]): TournamentRecord {
  const matches: MatchRecord[] = []
  const playedRounds = tournament.rounds.filter(r => r.completed || r.roundNumber === tournament.currentRound)

  for (const round of playedRounds) {
    for (const match of round.matches) {
      const record: MatchRecord = {
        round: round.roundNumber,
        court: match.courtIndex,
        team1: {
          playerIds: match.team1,
          score: match.score1 ?? 0,
        },
        team2: {
          playerIds: match.team2,
          score: match.score2 ?? 0,
        },
        winner: match.winner,
      }
      if (round.isEqualizerRound && round.fillInPlayerIds?.length) {
        record.fillInPlayerIds = round.fillInPlayerIds
      }
      matches.push(record)
    }
  }

  return {
    id: tournament.id,
    date: new Date().toISOString(),
    name: tournament.name,
    config: {
      courts: tournament.courts,
      totalRounds: playedRounds.length,
      scoringMode: tournament.scoringConfig.mode,
      pointsPerMatch: tournament.scoringConfig.pointsPerMatch,
      openEnded: tournament.openEnded ?? false,
      targetScore: tournament.scoringConfig.targetScore,
      matchDurationMinutes: tournament.scoringConfig.matchDurationMinutes,
    },
    playerIds: tournament.players.map(p => p.id),
    matches,
    excluded: false,
    leaderboardSnapshot: leaderboard.map(e => ({
      playerId: e.playerId,
      rank: e.rank,
      points: e.points,
      wins: e.wins,
      losses: e.losses,
      ties: e.ties,
      gamesPlayed: e.gamesPlayed,
      pointDifferential: e.pointDifferential,
    })),
  }
}
