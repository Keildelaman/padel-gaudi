import type { MatchHistory } from '../types'

type Pair = [string, string]

/**
 * Greedy weighted matching: form partner pairs from active players.
 * Pairs with fewest past partnerships are preferred.
 */
export function formPartnerPairs(
  activePlayerIds: string[],
  history: MatchHistory,
): Pair[] {
  // Generate all possible pairs with their partner repeat cost
  const candidates: { pair: Pair; cost: number }[] = []
  for (let i = 0; i < activePlayerIds.length; i++) {
    for (let j = i + 1; j < activePlayerIds.length; j++) {
      const a = activePlayerIds[i]
      const b = activePlayerIds[j]
      const cost = (history.partnerCount[a]?.[b] ?? 0)
      candidates.push({ pair: [a, b], cost })
    }
  }

  // Sort by cost ascending (prefer fresh partnerships)
  candidates.sort((a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost
    // Deterministic tiebreaker
    return (a.pair[0] + a.pair[1]).localeCompare(b.pair[0] + b.pair[1])
  })

  // Greedily pick non-conflicting pairs
  const used = new Set<string>()
  const pairs: Pair[] = []
  const targetPairs = activePlayerIds.length / 2

  for (const { pair } of candidates) {
    if (pairs.length >= targetPairs) break
    if (used.has(pair[0]) || used.has(pair[1])) continue
    pairs.push(pair)
    used.add(pair[0])
    used.add(pair[1])
  }

  return pairs
}
