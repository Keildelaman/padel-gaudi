import { useState, useCallback } from 'react'
import { Card, Button, NumberInput } from '../components/shared'
import { HeatmapGrid } from '../components/simulator/HeatmapGrid'
import { FairnessCards } from '../components/simulator/FairnessCards'
import { SchedulePreview } from '../components/simulator/SchedulePreview'
import { generateSchedule, generateScheduleMonteCarlo, computeFairnessMetrics } from '../algorithm'
import { buildMatrices } from '../algorithm/metrics'
import { MIN_PLAYERS, MAX_PLAYERS, MIN_COURTS, MAX_COURTS, MIN_ROUNDS, MAX_ROUNDS, MONTE_CARLO_DEFAULT_ITERATIONS } from '../constants'
import { effectiveCourts } from '../utils/validation'
import type { SimulatorResult, GeneratedSchedule } from '../types'

export function SimulatorPage() {
  const [playerCount, setPlayerCount] = useState(8)
  const [courts, setCourts] = useState(2)
  const [rounds, setRounds] = useState(10)
  const [mode, setMode] = useState<'greedy' | 'montecarlo'>('greedy')
  const [iterations, setIterations] = useState(MONTE_CARLO_DEFAULT_ITERATIONS)
  const [result, setResult] = useState<SimulatorResult | null>(null)
  const [running, setRunning] = useState(false)

  const eCourts = effectiveCourts(playerCount, courts)

  const runSimulation = useCallback(() => {
    setRunning(true)
    // Use setTimeout to let the UI update before heavy computation
    setTimeout(() => {
      const playerIds = Array.from({ length: playerCount }, (_, i) => String(i))
      const playerLabels = Array.from({ length: playerCount }, (_, i) => `P${i + 1}`)
      const config = { playerIds, courts: eCourts, totalRounds: rounds }

      let schedule: GeneratedSchedule
      if (mode === 'montecarlo') {
        schedule = generateScheduleMonteCarlo(config, iterations)
      } else {
        schedule = generateSchedule(config)
      }

      const metrics = computeFairnessMetrics(schedule, playerIds)
      const { partnerMatrix, opponentMatrix } = buildMatrices(schedule, playerIds)

      setResult({ schedule, metrics, partnerMatrix, opponentMatrix, playerLabels })
      setRunning(false)
    }, 10)
  }, [playerCount, courts, rounds, mode, iterations, eCourts])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold border-l-4 border-primary pl-3">Algorithm Simulator</h2>

      {/* Config Panel */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <NumberInput label="Players" value={playerCount} onChange={setPlayerCount} min={MIN_PLAYERS} max={MAX_PLAYERS} />
          <NumberInput label="Courts" value={courts} onChange={setCourts} min={MIN_COURTS} max={MAX_COURTS} />
          <NumberInput label="Rounds" value={rounds} onChange={setRounds} min={MIN_ROUNDS} max={MAX_ROUNDS} />
          {mode === 'montecarlo' && (
            <NumberInput label="Iterations" value={iterations} onChange={setIterations} min={10} max={1000} />
          )}
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex gap-2">
            <div className="relative group">
              <button
                onClick={() => setMode('greedy')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                  mode === 'greedy' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-600'
                }`}
              >
                Greedy
              </button>
              <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 font-normal">
                Builds the schedule round-by-round, always picking the fairest option. Fast and consistent — this is the same algorithm used when starting a real tournament.
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={() => setMode('montecarlo')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                  mode === 'montecarlo' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-600'
                }`}
              >
                Monte Carlo
              </button>
              <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 font-normal">
                Runs the algorithm many times with shuffled player orders and keeps the best result. Slower but may find better solutions.
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
              </div>
            </div>
          </div>
          <Button onClick={runSimulation} disabled={running}>
            {running ? 'Running...' : 'Run Simulation'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {eCourts} effective court(s), {eCourts * 4} players per round, {Math.max(0, playerCount - eCourts * 4)} pausing
        </p>
      </Card>

      {result && (
        <>
          {/* Fairness Metrics */}
          <FairnessCards metrics={result.metrics} />

          {/* Heatmaps side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <HeatmapGrid
                matrix={result.partnerMatrix}
                labels={result.playerLabels}
                colorLow="#eff6ff"
                colorHigh="#1d4ed8"
                title="Partner Frequency"
              />
            </Card>
            <Card>
              <HeatmapGrid
                matrix={result.opponentMatrix}
                labels={result.playerLabels}
                colorLow="#fef2f2"
                colorHigh="#dc2626"
                title="Opponent Frequency"
              />
            </Card>
          </div>

          {/* Schedule preview */}
          <Card padding={false}>
            <SchedulePreview schedule={result.schedule} playerLabels={result.playerLabels} />
          </Card>
        </>
      )}
    </div>
  )
}
