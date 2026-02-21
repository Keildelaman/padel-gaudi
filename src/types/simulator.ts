export interface SimulatorConfig {
  playerCount: number
  courts: number
  rounds: number
  mode: 'greedy' | 'montecarlo'
  monteCarloIterations: number
}

export interface SimulatorResult {
  schedule: import('./algorithm').GeneratedSchedule
  metrics: FairnessMetrics
  partnerMatrix: number[][] // NxN matrix of partner counts
  opponentMatrix: number[][] // NxN matrix of opponent counts
  playerLabels: string[]
}

export interface FairnessMetrics {
  gamesPlayedStdDev: number
  pauseCountStdDev: number
  maxPauseGap: number
  maxGamesGap: number
  partnerVarietyIndex: number  // 0-1, 1 = perfect
  opponentVarietyIndex: number // 0-1, 1 = perfect
  totalPartnerRepeats: number
  totalOpponentRepeats: number
}
