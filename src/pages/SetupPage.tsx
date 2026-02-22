import { useState, useRef, useEffect, useCallback } from 'react'
import { useTournament } from '../state'
import { Card, Button, NumberInput, GenerationInfoBar } from '../components/shared'
import { FairnessCards } from '../components/simulator/FairnessCards'
import { HeatmapGrid } from '../components/simulator/HeatmapGrid'
import {
  MIN_PLAYERS, MAX_PLAYERS, MIN_COURTS, MAX_COURTS, MIN_ROUNDS, MAX_ROUNDS,
  DEFAULT_POINTS_PER_MATCH, DEFAULT_TOURNAMENT_NAME, PLAYERS_PER_COURT,
  MONTE_CARLO_DEFAULT_ITERATIONS,
} from '../constants'
import { validatePlayerNames, suggestRoundCount, effectiveCourts } from '../utils/validation'
import { generateScheduleMonteCarlo, computeFairnessMetrics } from '../algorithm'
import { buildMatrices } from '../algorithm/metrics'
import { generateId } from '../utils/ids'
import { useT } from '../i18n'
import type { ScoringMode, Player, Round, GeneratedSchedule, GenerationInfo, FairnessMetrics } from '../types'

function ensureTrailingEmpty(names: string[]): string[] {
  if (names.length === 0 || names[names.length - 1].trim() !== '') {
    return [...names, '']
  }
  return names
}

interface SchedulePreviewData {
  schedule: GeneratedSchedule
  rounds: Round[]
  metrics: FairnessMetrics
  partnerMatrix: number[][]
  opponentMatrix: number[][]
  playerLabels: string[]
  players: Player[]
  generationInfo?: GenerationInfo
}

export function SetupPage() {
  const { state, dispatch } = useTournament()
  const { t } = useT()

  const draft = state.setupDraft
  const [name, setName] = useState(draft?.name ?? DEFAULT_TOURNAMENT_NAME)
  const [scoringMode, setScoringMode] = useState<ScoringMode>(draft?.scoringMode ?? 'points')
  const [pointsPerMatch, setPointsPerMatch] = useState(draft?.pointsPerMatch ?? DEFAULT_POINTS_PER_MATCH)
  const [playerNames, setPlayerNames] = useState<string[]>(
    ensureTrailingEmpty(draft?.playerNames ?? ['', '', '', ''])
  )
  const [courts, setCourts] = useState(draft?.courts ?? 1)
  const [rounds, setRounds] = useState(draft?.rounds ?? 6)
  const [openEnded, setOpenEnded] = useState(draft?.openEnded ?? false)
  const [courtNames, setCourtNames] = useState<string[]>(draft?.courtNames ?? [])
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<SchedulePreviewData | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    dispatch({
      type: 'SAVE_SETUP_DRAFT',
      payload: { name, scoringMode, pointsPerMatch, playerNames, courts, rounds, openEnded, courtNames },
    })
  }, [name, scoringMode, pointsPerMatch, playerNames, courts, rounds, openEnded, courtNames, dispatch])

  const playerRefs = useRef<(HTMLInputElement | null)[]>([])

  const validNames = playerNames.filter(n => n.trim().length > 0)
  const maxCourts = Math.min(MAX_COURTS, Math.floor(validNames.length / PLAYERS_PER_COURT))
  const eCourts = effectiveCourts(validNames.length, courts)
  const suggested = validNames.length >= MIN_PLAYERS ? suggestRoundCount(validNames.length, eCourts) : 6

  const removePlayer = (index: number) => {
    const updated = playerNames.filter((_, i) => i !== index)
    setPlayerNames(ensureTrailingEmpty(updated))
  }

  const updatePlayer = (index: number, value: string) => {
    const updated = [...playerNames]
    updated[index] = value
    if (index === updated.length - 1 && value.trim().length > 0) {
      const filledCount = updated.filter(n => n.trim().length > 0).length
      if (filledCount < MAX_PLAYERS) {
        updated.push('')
      }
    }
    setPlayerNames(updated)
  }

  const handlePlayerKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (index < playerNames.length - 1) {
        playerRefs.current[index + 1]?.focus()
      }
    }
  }

  const generatePreview = useCallback((players: Player[], numCourts: number, numRounds: number): SchedulePreviewData => {
    const playerIds = players.map(p => p.id)
    const config = { playerIds, courts: numCourts, totalRounds: numRounds }
    const schedule = generateScheduleMonteCarlo(config, MONTE_CARLO_DEFAULT_ITERATIONS)
    const metrics = computeFairnessMetrics(schedule, playerIds)
    const { partnerMatrix, opponentMatrix } = buildMatrices(schedule, playerIds)

    const builtRounds: Round[] = schedule.rounds.map(gr => ({
      roundNumber: gr.roundNumber,
      matches: gr.matches.map(gm => ({
        courtIndex: gm.courtIndex,
        team1: gm.team1,
        team2: gm.team2,
      })),
      pausedPlayerIds: gr.pausedPlayerIds,
      completed: false,
    }))

    return {
      schedule,
      rounds: builtRounds,
      metrics,
      partnerMatrix,
      opponentMatrix,
      playerLabels: players.map(p => p.name),
      players,
      generationInfo: schedule.info,
    }
  }, [])

  const handleStart = () => {
    const names = playerNames.map(n => n.trim()).filter(n => n.length > 0)
    const nameError = validatePlayerNames(names, t)
    if (nameError) { setError(nameError); return }
    if (eCourts < 1) { setError(t('setup.notEnoughPlayers')); return }
    setError(null)

    const players: Player[] = names.map(n => ({ id: generateId(), name: n }))
    const effectiveRounds = openEnded ? 30 : rounds
    setGenerating(true)
    setTimeout(() => {
      setPreview(generatePreview(players, eCourts, effectiveRounds))
      setGenerating(false)
    }, 10)
  }

  const handleRegenerate = () => {
    if (!preview) return
    const effectiveRounds = openEnded ? 30 : rounds
    setGenerating(true)
    setTimeout(() => {
      setPreview(generatePreview(preview.players, eCourts, effectiveRounds))
      setGenerating(false)
    }, 10)
  }

  const handleConfirmStart = () => {
    if (!preview) return
    const finalCourtNames = courtNames.slice(0, eCourts)
    const hasCustomNames = finalCourtNames.some(n => n.trim().length > 0)
    dispatch({
      type: 'START_TOURNAMENT',
      payload: {
        name: name.trim() || DEFAULT_TOURNAMENT_NAME,
        players: preview.players,
        courts: eCourts,
        totalRounds: rounds,
        scoringConfig: { mode: scoringMode, pointsPerMatch },
        rounds: preview.rounds,
        openEnded,
        courtNames: hasCustomNames ? finalCourtNames.map((n, i) => n.trim() || t('setup.courtPlaceholder', { n: i + 1 })) : undefined,
      },
    })
  }

  // If tournament is active, show a resume/new option
  if (state.tournament && state.tournament.phase !== 'finished') {
    const totalPart = state.tournament.openEnded ? '' : t('setup.inProgressOf', { n: state.tournament.totalRounds })
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <h2 className="text-xl font-bold mb-2">{t('setup.inProgress')}</h2>
          <p className="text-gray-600 mb-4">
            {t('setup.inProgressDesc', { name: state.tournament.name, current: state.tournament.currentRound, total: totalPart })}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => dispatch({ type: 'NAVIGATE_PAGE', payload: { page: 'round' } })}>
              {t('setup.resume')}
            </Button>
            <Button variant="destructive" onClick={() => dispatch({ type: 'RESET_TOURNAMENT' })}>
              {t('setup.startNew')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Schedule Preview
  if (preview) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold border-l-4 border-primary pl-3">{t('preview.title')}</h2>

        {openEnded && (
          <p className="text-sm text-gray-500 italic">{t('preview.openEndedHint')}</p>
        )}

        <FairnessCards metrics={preview.metrics} />

        {preview.generationInfo && (
          <GenerationInfoBar info={preview.generationInfo} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <HeatmapGrid
              matrix={preview.partnerMatrix}
              labels={preview.playerLabels}
              colorLow="#eff6ff"
              colorHigh="#1d4ed8"
              title={t('preview.partnerFrequency')}
            />
          </Card>
          <Card>
            <HeatmapGrid
              matrix={preview.opponentMatrix}
              labels={preview.playerLabels}
              colorLow="#fef2f2"
              colorHigh="#dc2626"
              title={t('preview.opponentFrequency')}
            />
          </Card>
        </div>

        <div className="flex justify-between gap-3">
          <Button variant="secondary" onClick={() => setPreview(null)}>
            {t('preview.back')}
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleRegenerate} disabled={generating}>
              {generating ? t('setup.generating') : t('preview.regenerate')}
            </Button>
            <Button onClick={handleConfirmStart}>
              {t('preview.confirmStart')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold border-l-4 border-primary pl-3">{t('setup.title')}</h2>

      {/* Tournament Name */}
      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('setup.tournamentName')}</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={DEFAULT_TOURNAMENT_NAME}
        />
      </Card>

      {/* Scoring Mode */}
      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('setup.scoringMode')}</label>
        <div className="flex gap-2">
          <button
            onClick={() => setScoringMode('points')}
            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
              scoringMode === 'points'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('setup.scoringPoints')}
          </button>
          <button
            onClick={() => setScoringMode('winloss')}
            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
              scoringMode === 'winloss'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('setup.scoringWinLoss')}
          </button>
        </div>
        {scoringMode === 'points' && (
          <div className="mt-3">
            <NumberInput
              label={t('setup.pointsPerMatch')}
              value={pointsPerMatch}
              onChange={setPointsPerMatch}
              min={4}
              max={100}
            />
            <p className="text-xs text-gray-500 mt-1">{t('setup.pointsPerMatchHint')}</p>
          </div>
        )}
      </Card>

      {/* Two-column grid: Players + Courts/Rounds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Players */}
        <Card>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            {t('setup.players', { count: validNames.length })}
          </label>
          <div className="space-y-2">
            {playerNames.map((pName, i) => {
              const isAutoGrowSlot = i === playerNames.length - 1 && pName.trim() === ''
              return (
                <div key={i} className="flex gap-2">
                  <input
                    ref={el => { playerRefs.current[i] = el }}
                    type="text"
                    value={pName}
                    onChange={e => updatePlayer(i, e.target.value)}
                    onKeyDown={e => handlePlayerKeyDown(i, e)}
                    placeholder={isAutoGrowSlot ? t('setup.addPlayer') : t('setup.playerPlaceholder', { n: i + 1 })}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                      isAutoGrowSlot ? 'border-dashed border-gray-300' : 'border-gray-300'
                    }`}
                  />
                  {!isAutoGrowSlot && (
                    <button
                      onClick={() => removePlayer(i)}
                      className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    >
                      &times;
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Courts & Rounds */}
        <div className="space-y-6">
          <Card>
            {/* Round mode toggle */}
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('setup.roundMode')}</label>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setOpenEnded(false)}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  !openEnded
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('setup.fixedRounds')}
              </button>
              <button
                onClick={() => setOpenEnded(true)}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  openEnded
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('setup.openEnded')}
              </button>
            </div>

            <div className={openEnded ? '' : 'grid grid-cols-2 gap-6'}>
              <NumberInput
                label={t('setup.courts')}
                value={courts}
                onChange={setCourts}
                min={MIN_COURTS}
                max={Math.max(1, maxCourts)}
              />
              {!openEnded && (
                <NumberInput
                  label={t('setup.rounds')}
                  value={rounds}
                  onChange={setRounds}
                  min={MIN_ROUNDS}
                  max={MAX_ROUNDS}
                />
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>{t('setup.courtInfo', { courts: eCourts, playing: eCourts * PLAYERS_PER_COURT, sitting: Math.max(0, validNames.length - eCourts * PLAYERS_PER_COURT) })}</p>
              {!openEnded && validNames.length >= MIN_PLAYERS && (
                <div className="flex items-center gap-1">
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setRounds(suggested)}
                  >
                    {t('setup.suggested', { n: suggested })}
                  </button>
                  <div className="relative group">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold cursor-help">?</span>
                    <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                      {t('setup.suggestedTooltip')}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
                    </div>
                  </div>
                </div>
              )}
              {openEnded && (
                <p className="text-gray-400 italic">{t('setup.openEndedHint')}</p>
              )}
            </div>

            {eCourts > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('setup.courtNames')} <span className="text-gray-400 font-normal">{t('setup.courtNamesOptional')}</span></label>
                <div className="space-y-2">
                  {Array.from({ length: eCourts }, (_, i) => (
                    <input
                      key={i}
                      type="text"
                      value={courtNames[i] ?? ''}
                      onChange={e => {
                        const updated = [...courtNames]
                        while (updated.length <= i) updated.push('')
                        updated[i] = e.target.value
                        setCourtNames(updated)
                      }}
                      placeholder={t('setup.courtPlaceholder', { n: i + 1 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm font-medium">{error}</p>
      )}

      <Button fullWidth onClick={handleStart} disabled={validNames.length < MIN_PLAYERS || generating}>
        {generating ? t('setup.generating') : t('setup.startTournament')}
      </Button>
    </div>
  )
}
