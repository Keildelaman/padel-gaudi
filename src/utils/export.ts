import type { LeaderboardEntry } from '../types'

type TFn = (key: string, params?: Record<string, string | number>) => string

export function leaderboardToCsv(entries: LeaderboardEntry[], t: TFn): string {
  const hasTies = entries.some(e => e.ties > 0)
  const headers = [
    t('export.rank'), t('export.name'), t('export.points'), t('export.wins'),
    t('export.losses'), ...(hasTies ? [t('export.ties')] : []),
    t('export.played'), t('export.paused'), t('export.pointDiff'),
  ]
  const rows = entries.map(e => [
    e.rank, e.playerName, e.points, e.wins, e.losses, ...(hasTies ? [e.ties] : []),
    e.gamesPlayed, e.gamesPaused, e.pointDifferential
  ])
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

export function leaderboardToText(entries: LeaderboardEntry[], t: TFn): string {
  const maxName = Math.max(...entries.map(e => e.playerName.length), 4)
  const hasTies = entries.some(e => e.ties > 0)
  const tiesHeader = hasTies ? ` ${t('export.textTies').padStart(3)}` : ''
  const header = `${t('export.textRank').padStart(3)} ${t('export.textName').padEnd(maxName)} ${t('export.textPts').padStart(4)} ${t('export.textWins').padStart(3)} ${t('export.textLosses').padStart(3)}${tiesHeader}`
  const separator = '-'.repeat(header.length)
  const rows = entries.map(e => {
    const tiesCol = hasTies ? ` ${String(e.ties).padStart(3)}` : ''
    return `${String(e.rank).padStart(3)} ${e.playerName.padEnd(maxName)} ${String(e.points).padStart(4)} ${String(e.wins).padStart(3)} ${String(e.losses).padStart(3)}${tiesCol}`
  })
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
