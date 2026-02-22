import type { MatchHistory } from '../types'

type Pair = [string, string]

/**
 * Greedy weighted matching: form partner pairs from active players.
 * Pairs with fewest past partnerships are preferred.
 */
export function formPartnerPairs(
  activePlayerIds: string[],
  history: MatchHistory,
  randomize = false,
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
    if (randomize) return Math.random() - 0.5
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

export interface OptimalMatchResult {
  pairs: Pair[]
  exhausted: boolean   // true if backtracking hit the iteration budget
  iterations: number   // total backtrack nodes visited
}

/**
 * Optimal partner matching via backtracking.
 * Finds the minimum-cost perfect matching by trying all valid combinations.
 *
 * Has an iteration budget (default 50,000 nodes). If exceeded, returns the
 * best solution found so far. If no solution was found at all, falls back
 * to greedy matching.
 *
 * When randomize=true, shuffles the player order before solving so that
 * different optimal solutions are found when there are cost ties.
 */
export function formPartnerPairsOptimal(
  activePlayerIds: string[],
  history: MatchHistory,
  randomize = false,
  maxIterations = 50_000,
): OptimalMatchResult {
  const n = activePlayerIds.length
  if (n < 2) return { pairs: [], exhausted: false, iterations: 0 }
  if (n === 2) return { pairs: [[activePlayerIds[0], activePlayerIds[1]]], exhausted: false, iterations: 1 }

  // Optionally shuffle to explore different tie-breaking orders
  let ids = activePlayerIds
  if (randomize) {
    ids = [...activePlayerIds]
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]]
    }
  }

  // Precompute cost lookup
  const costOf = (i: number, j: number): number => {
    return history.partnerCount[ids[i]]?.[ids[j]] ?? 0
  }

  let bestPairs: [number, number][] = []
  let bestCost = Infinity
  const currentPairs: [number, number][] = []
  const paired = new Uint8Array(n)
  let currentCost = 0
  let nodeCount = 0
  let budgetExhausted = false

  function backtrack(): boolean {
    if (++nodeCount > maxIterations) {
      budgetExhausted = true
      return false
    }

    // Find first unpaired player
    let first = -1
    for (let i = 0; i < n; i++) {
      if (!paired[i]) { first = i; break }
    }

    if (first === -1) {
      // All paired
      if (currentCost < bestCost) {
        bestCost = currentCost
        bestPairs = [...currentPairs]
      }
      return true
    }

    // Prune: current cost already >= best
    if (currentCost >= bestCost) return true

    for (let j = first + 1; j < n; j++) {
      if (paired[j]) continue

      const pairCost = costOf(first, j)
      paired[first] = 1
      paired[j] = 1
      currentCost += pairCost
      currentPairs.push([first, j])

      if (!backtrack()) return false

      currentPairs.pop()
      currentCost -= pairCost
      paired[first] = 0
      paired[j] = 0
    }

    return true
  }

  backtrack()

  // If budget exhausted and no solution found, fall back to greedy
  if (bestPairs.length === 0) {
    return {
      pairs: formPartnerPairs(activePlayerIds, history, randomize),
      exhausted: true,
      iterations: nodeCount,
    }
  }

  return {
    pairs: bestPairs.map(([i, j]) => [ids[i], ids[j]] as Pair),
    exhausted: budgetExhausted,
    iterations: nodeCount,
  }
}
