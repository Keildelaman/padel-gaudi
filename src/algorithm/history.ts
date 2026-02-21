import type { MatchHistory, GeneratedMatch } from '../types'

export function createEmptyHistory(playerIds: string[]): MatchHistory {
  const partnerCount: Record<string, Record<string, number>> = {}
  const opponentCount: Record<string, Record<string, number>> = {}
  for (const id of playerIds) {
    partnerCount[id] = {}
    opponentCount[id] = {}
  }
  return { partnerCount, opponentCount }
}

export function updateHistory(
  history: MatchHistory,
  matches: GeneratedMatch[],
): MatchHistory {
  const pc = deepCloneRecord(history.partnerCount)
  const oc = deepCloneRecord(history.opponentCount)

  for (const match of matches) {
    // Partner counts (symmetric)
    increment(pc, match.team1[0], match.team1[1])
    increment(pc, match.team1[1], match.team1[0])
    increment(pc, match.team2[0], match.team2[1])
    increment(pc, match.team2[1], match.team2[0])

    // Opponent counts (symmetric)
    for (const a of match.team1) {
      for (const b of match.team2) {
        increment(oc, a, b)
        increment(oc, b, a)
      }
    }
  }

  return { partnerCount: pc, opponentCount: oc }
}

function increment(record: Record<string, Record<string, number>>, a: string, b: string) {
  if (!record[a]) record[a] = {}
  record[a][b] = (record[a][b] ?? 0) + 1
}

function deepCloneRecord(r: Record<string, Record<string, number>>): Record<string, Record<string, number>> {
  const clone: Record<string, Record<string, number>> = {}
  for (const key in r) {
    clone[key] = { ...r[key] }
  }
  return clone
}
