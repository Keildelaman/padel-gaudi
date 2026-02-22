/**
 * Fairness analysis test script.
 * Run with: npx tsx scripts/test-fairness.ts
 */
import { generateSchedule, generateScheduleMonteCarlo, computeFairnessMetrics } from '../src/algorithm/index'
import { buildMatrices } from '../src/algorithm/metrics'
import type { ScheduleConfig, GeneratedSchedule } from '../src/types'

interface TestConfig {
  players: number
  courts: number
  rounds: number
}

const CONFIGS: TestConfig[] = [
  { players: 10, courts: 2, rounds: 15 },
  { players: 12, courts: 2, rounds: 15 },
  { players: 12, courts: 3, rounds: 15 },
  { players: 14, courts: 3, rounds: 15 },
  { players: 16, courts: 3, rounds: 15 },
  { players: 16, courts: 4, rounds: 15 },
]

function makePlayerIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `P${String(i + 1).padStart(2, '0')}`)
}

function printMatrix(matrix: number[][], labels: string[], name: string) {
  const n = labels.length
  const shortLabels = labels.map(l => l.slice(1)) // remove 'P' prefix

  // Header
  console.log(`\n  ${name} Matrix:`)
  console.log('     ' + shortLabels.map(l => l.padStart(3)).join(''))

  for (let i = 0; i < n; i++) {
    let row = shortLabels[i].padStart(4) + ' '
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row += '  .'
      } else {
        row += String(matrix[i][j]).padStart(3)
      }
    }
    console.log(row)
  }
}

function analyzeMatrix(matrix: number[][], n: number, name: string) {
  const values: number[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      values.push(matrix[i][j])
    }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const zeros = values.filter(v => v === 0).length
  const totalPairs = values.length
  const repeats = values.reduce((sum, v) => sum + Math.max(0, v - 1), 0)

  // Distribution
  const dist: Record<number, number> = {}
  for (const v of values) {
    dist[v] = (dist[v] ?? 0) + 1
  }

  console.log(`  ${name}: min=${min} max=${max} avg=${avg.toFixed(2)} zeros=${zeros}/${totalPairs} repeats=${repeats}`)
  console.log(`    Distribution: ${Object.entries(dist).sort((a, b) => +a[0] - +b[0]).map(([k, v]) => `${k}x:${v}`).join(' ')}`)
}

function theoreticalAnalysis(players: number, courts: number, rounds: number) {
  const uniquePairs = players * (players - 1) / 2
  const partnerSlotsPerRound = courts * 2
  const totalPartnerSlots = partnerSlotsPerRound * rounds
  const avgPartnerPerPair = totalPartnerSlots / uniquePairs
  const rMinPartner = Math.ceil(uniquePairs / partnerSlotsPerRound)

  const opponentSlotsPerRound = courts * 4
  const totalOpponentSlots = opponentSlotsPerRound * rounds
  const avgOpponentPerPair = totalOpponentSlots / uniquePairs
  const rMinOpponent = Math.ceil(uniquePairs / opponentSlotsPerRound)

  const playersPerRound = courts * 4
  const pausesPerRound = players - playersPerRound

  console.log(`  Theory: ${uniquePairs} unique pairs, ${partnerSlotsPerRound} partner slots/round, ${totalPartnerSlots} total`)
  console.log(`    Avg partner/pair: ${avgPartnerPerPair.toFixed(2)}, R_min for all-partner: ${rMinPartner}`)
  console.log(`    Avg opponent/pair: ${avgOpponentPerPair.toFixed(2)}, R_min for all-opponent: ${rMinOpponent}`)
  console.log(`    Pauses/round: ${pausesPerRound}, ideal: all 0s + ${avgPartnerPerPair < 1 ? 'IMPOSSIBLE' : `all 1s (need ${rMinPartner} rounds)`}`)
}

function runTest(tc: TestConfig, mode: 'greedy' | 'montecarlo', mcIterations = 100) {
  const playerIds = makePlayerIds(tc.players)
  const config: ScheduleConfig = {
    playerIds,
    courts: tc.courts,
    totalRounds: tc.rounds,
  }

  const start = performance.now()
  let schedule: GeneratedSchedule
  if (mode === 'montecarlo') {
    schedule = generateScheduleMonteCarlo(config, mcIterations)
  } else {
    schedule = generateSchedule(config)
  }
  const elapsed = performance.now() - start

  const metrics = computeFairnessMetrics(schedule, playerIds)
  const { partnerMatrix, opponentMatrix } = buildMatrices(schedule, playerIds)

  console.log(`\n${'='.repeat(70)}`)
  console.log(`${tc.players}P / ${tc.courts}C / ${tc.rounds}R — ${mode}${mode === 'montecarlo' ? ` (${mcIterations} iter)` : ''} — ${elapsed.toFixed(0)}ms`)
  console.log('='.repeat(70))

  theoreticalAnalysis(tc.players, tc.courts, tc.rounds)

  printMatrix(partnerMatrix, playerIds, 'Partner')
  analyzeMatrix(partnerMatrix, tc.players, 'Partner')

  printMatrix(opponentMatrix, playerIds, 'Opponent')
  analyzeMatrix(opponentMatrix, tc.players, 'Opponent')

  console.log(`\n  Fairness Metrics:`)
  console.log(`    Partner variety index: ${metrics.partnerVarietyIndex.toFixed(4)}`)
  console.log(`    Opponent variety index: ${metrics.opponentVarietyIndex.toFixed(4)}`)
  console.log(`    Max partner gap: ${metrics.maxPartnerGap}`)
  console.log(`    Max opponent gap: ${metrics.maxOpponentGap}`)
  console.log(`    Games stddev: ${metrics.gamesPlayedStdDev.toFixed(3)}, max gap: ${metrics.maxGamesGap}`)
  console.log(`    Pause stddev: ${metrics.pauseCountStdDev.toFixed(3)}, max gap: ${metrics.maxPauseGap}`)

  if (schedule.info) {
    const info = schedule.info
    console.log(`\n  Generation Info:`)
    console.log(`    Method: ${info.method} (${info.iterations} iterations)`)
    console.log(`    Matching: ${info.useOptimal ? 'optimal' : 'greedy'}${info.optimalDisabledReason ? ` (disabled: ${info.optimalDisabledReason})` : ''}`)
    console.log(`    Backtrack calls: ${info.totalBacktrackCalls}, budget exhausted: ${info.budgetExhaustedCount}x`)
    console.log(`    Elapsed: ${info.elapsedMs}ms`)
  }
}

// === Run all tests ===
console.log('\n' + '#'.repeat(70))
console.log('# FAIRNESS ANALYSIS — GREEDY (deterministic)')
console.log('#'.repeat(70))

for (const tc of CONFIGS) {
  runTest(tc, 'greedy')
}

console.log('\n\n' + '#'.repeat(70))
console.log('# FAIRNESS ANALYSIS — MONTE CARLO (200 iterations)')
console.log('#'.repeat(70))

for (const tc of CONFIGS) {
  runTest(tc, 'montecarlo', 200)
}
