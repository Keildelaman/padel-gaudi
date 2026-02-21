import type { LeaderboardEntry } from '../types'

export function leaderboardToCsv(entries: LeaderboardEntry[]): string {
  const headers = ['Rank', 'Name', 'Points', 'Wins', 'Losses', 'Played', 'Paused', 'Point Diff']
  const rows = entries.map(e => [
    e.rank, e.playerName, e.points, e.wins, e.losses, e.gamesPlayed, e.gamesPaused, e.pointDifferential
  ])
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

export function leaderboardToText(entries: LeaderboardEntry[]): string {
  const maxName = Math.max(...entries.map(e => e.playerName.length), 4)
  const header = `${'#'.padStart(3)} ${'Name'.padEnd(maxName)} ${'Pts'.padStart(4)} ${'W'.padStart(3)} ${'L'.padStart(3)}`
  const separator = '-'.repeat(header.length)
  const rows = entries.map(e =>
    `${String(e.rank).padStart(3)} ${e.playerName.padEnd(maxName)} ${String(e.points).padStart(4)} ${String(e.wins).padStart(3)} ${String(e.losses).padStart(3)}`
  )
  return [header, separator, ...rows].join('\n')
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
