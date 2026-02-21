import type { MatchHistory, GeneratedMatch } from '../types'

type Pair = [string, string]

/**
 * Given partner pairs, group them into court matches (2 pairs per court).
 * Minimize opponent repeat count.
 */
export function assignOpponents(
  pairs: Pair[],
  history: MatchHistory,
): GeneratedMatch[] {
  // Generate all possible matchups (pair-of-pairs)
  const matchups: { p1: Pair; p2: Pair; cost: number }[] = []
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const cost = opponentCost(pairs[i], pairs[j], history)
      matchups.push({ p1: pairs[i], p2: pairs[j], cost })
    }
  }

  // Sort by cost ascending
  matchups.sort((a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost
    return 0
  })

  // Greedily pick non-conflicting matchups
  const usedPairs = new Set<number>()
  const matches: GeneratedMatch[] = []
  let courtIndex = 0

  for (const matchup of matchups) {
    const i = pairs.indexOf(matchup.p1)
    const j = pairs.indexOf(matchup.p2)
    if (usedPairs.has(i) || usedPairs.has(j)) continue

    matches.push({
      courtIndex,
      team1: matchup.p1,
      team2: matchup.p2,
    })
    usedPairs.add(i)
    usedPairs.add(j)
    courtIndex++
  }

  return matches
}

function opponentCost(pair1: Pair, pair2: Pair, history: MatchHistory): number {
  let cost = 0
  for (const a of pair1) {
    for (const b of pair2) {
      cost += history.opponentCount[a]?.[b] ?? 0
    }
  }
  return cost
}
