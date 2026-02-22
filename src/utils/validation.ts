import { MIN_PLAYERS, MAX_PLAYERS, MIN_COURTS, MAX_COURTS, MIN_ROUNDS, MAX_ROUNDS, PLAYERS_PER_COURT } from '../constants'

type TFn = (key: string, params?: Record<string, string | number>) => string

export function validatePlayerCount(count: number, t: TFn): string | null {
  if (count < MIN_PLAYERS) return t('validation.minPlayers', { min: MIN_PLAYERS })
  if (count > MAX_PLAYERS) return t('validation.maxPlayers', { max: MAX_PLAYERS })
  return null
}

export function validateCourtCount(courts: number, playerCount: number, t: TFn): string | null {
  if (courts < MIN_COURTS) return t('validation.minCourts', { min: MIN_COURTS })
  if (courts > MAX_COURTS) return t('validation.maxCourts', { max: MAX_COURTS })
  const maxEffective = Math.floor(playerCount / PLAYERS_PER_COURT)
  if (courts > maxEffective) return t('validation.courtsUsable', { max: maxEffective, count: playerCount })
  return null
}

export function validateRoundCount(rounds: number, t: TFn): string | null {
  if (rounds < MIN_ROUNDS) return t('validation.minRounds', { min: MIN_ROUNDS })
  if (rounds > MAX_ROUNDS) return t('validation.maxRounds', { max: MAX_ROUNDS })
  return null
}

export function validatePlayerNames(names: string[], t: TFn): string | null {
  const trimmed = names.map(n => n.trim()).filter(n => n.length > 0)
  if (trimmed.length < MIN_PLAYERS) return t('validation.minPlayers', { min: MIN_PLAYERS })
  const lowerNames = trimmed.map(n => n.toLowerCase())
  const duplicates = lowerNames.filter((n, i) => lowerNames.indexOf(n) !== i)
  if (duplicates.length > 0) return t('validation.duplicateName', { name: duplicates[0] })
  return null
}

export function suggestRoundCount(playerCount: number, courts: number): number {
  const partnershipsPerRound = courts * 2  // each court produces 2 partner pairs
  return Math.ceil((playerCount * (playerCount - 1)) / (2 * partnershipsPerRound))
}

export function effectiveCourts(playerCount: number, requestedCourts: number): number {
  return Math.min(requestedCourts, Math.floor(playerCount / PLAYERS_PER_COURT))
}
