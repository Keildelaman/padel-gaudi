export interface PlayerStats {
  playerId: string
  playerName: string
  points: number
  wins: number
  losses: number
  gamesPlayed: number
  gamesPaused: number
  pointDifferential: number
  // Per-round breakdown
  roundResults: RoundResult[]
}

export interface RoundResult {
  roundNumber: number
  paused: boolean
  courtIndex?: number
  partnerId?: string
  opponentIds?: [string, string]
  pointsScored?: number
  pointsConceded?: number
  won?: boolean
}

export interface LeaderboardEntry extends PlayerStats {
  rank: number
}
