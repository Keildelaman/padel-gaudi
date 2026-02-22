export interface ScheduleConfig {
  playerIds: string[]
  courts: number
  totalRounds: number
}

export interface PauseState {
  pauseCount: Record<string, number>
  gamesPlayed: Record<string, number>
  lastPausedRound: Record<string, number>
}

export interface MatchHistory {
  partnerCount: Record<string, Record<string, number>> // partnerCount[a][b] = times a & b partnered
  opponentCount: Record<string, Record<string, number>> // opponentCount[a][b] = times a faced b
}

export interface GenerationInfo {
  method: 'greedy' | 'montecarlo'
  iterations: number            // MC iterations run (1 for greedy)
  useOptimal: boolean           // was optimal matching used
  optimalDisabledReason: string | null  // why optimal was disabled, if applicable
  budgetExhaustedCount: number  // how many times backtracking hit its cap
  totalBacktrackCalls: number   // total backtrack nodes visited across entire generation
  elapsedMs: number             // wall-clock time
}

export interface GeneratedSchedule {
  rounds: GeneratedRound[]
  info?: GenerationInfo
}

export interface GeneratedRound {
  roundNumber: number
  matches: GeneratedMatch[]
  pausedPlayerIds: string[]
}

export interface GeneratedMatch {
  courtIndex: number
  team1: [string, string]
  team2: [string, string]
}
