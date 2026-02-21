import { MIN_PLAYERS, MAX_PLAYERS, MIN_COURTS, MAX_COURTS, MIN_ROUNDS, MAX_ROUNDS, PLAYERS_PER_COURT } from '../constants'

export function validatePlayerCount(count: number): string | null {
  if (count < MIN_PLAYERS) return `At least ${MIN_PLAYERS} players required`
  if (count > MAX_PLAYERS) return `Maximum ${MAX_PLAYERS} players allowed`
  return null
}

export function validateCourtCount(courts: number, playerCount: number): string | null {
  if (courts < MIN_COURTS) return `At least ${MIN_COURTS} court required`
  if (courts > MAX_COURTS) return `Maximum ${MAX_COURTS} courts allowed`
  const maxEffective = Math.floor(playerCount / PLAYERS_PER_COURT)
  if (courts > maxEffective) return `Only ${maxEffective} court(s) usable with ${playerCount} players`
  return null
}

export function validateRoundCount(rounds: number): string | null {
  if (rounds < MIN_ROUNDS) return `At least ${MIN_ROUNDS} round required`
  if (rounds > MAX_ROUNDS) return `Maximum ${MAX_ROUNDS} rounds allowed`
  return null
}

export function validatePlayerNames(names: string[]): string | null {
  const trimmed = names.map(n => n.trim()).filter(n => n.length > 0)
  if (trimmed.length < MIN_PLAYERS) return `At least ${MIN_PLAYERS} players required`
  const lowerNames = trimmed.map(n => n.toLowerCase())
  const duplicates = lowerNames.filter((n, i) => lowerNames.indexOf(n) !== i)
  if (duplicates.length > 0) return `Duplicate name: ${duplicates[0]}`
  return null
}

export function suggestRoundCount(playerCount: number, courts: number): number {
  const playersPerRound = courts * PLAYERS_PER_COURT
  return Math.ceil((playerCount * (playerCount - 1)) / (2 * playersPerRound))
}

export function effectiveCourts(playerCount: number, requestedCourts: number): number {
  return Math.min(requestedCourts, Math.floor(playerCount / PLAYERS_PER_COURT))
}
