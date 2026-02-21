import type { MatchHistory, GeneratedMatch } from '../types'
import { SCORING_PENALTIES } from '../constants'

/**
 * Score a round arrangement: lower = better.
 */
export function scoreArrangement(
  matches: GeneratedMatch[],
  history: MatchHistory,
): number {
  let score = 0

  for (const match of matches) {
    // Partner repeat penalty
    score += (history.partnerCount[match.team1[0]]?.[match.team1[1]] ?? 0) * SCORING_PENALTIES.partnerRepeat
    score += (history.partnerCount[match.team2[0]]?.[match.team2[1]] ?? 0) * SCORING_PENALTIES.partnerRepeat

    // Opponent repeat penalty
    for (const a of match.team1) {
      for (const b of match.team2) {
        score += (history.opponentCount[a]?.[b] ?? 0) * SCORING_PENALTIES.opponentRepeat
      }
    }
  }

  return score
}
