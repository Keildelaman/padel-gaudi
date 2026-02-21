import { useState } from 'react'
import type { Tournament } from '../../types'
import { getLeaderboard } from '../../state/selectors'
import { useT } from '../../i18n'

interface RoundStatsProps {
  tournament: Tournament
}

export function RoundStats({ tournament }: RoundStatsProps) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const leaderboard = getLeaderboard(tournament)
  const top5 = leaderboard.slice(0, 5)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>{t('roundStats.standings')}</span>
        <span className="text-gray-400">{open ? '\u2212' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left py-1">{t('roundStats.rank')}</th>
                <th className="text-left py-1">{t('roundStats.name')}</th>
                <th className="text-right py-1">{t('roundStats.points')}</th>
                <th className="text-right py-1">{t('roundStats.wins')}</th>
              </tr>
            </thead>
            <tbody>
              {top5.map(entry => (
                <tr key={entry.playerId} className="border-t border-gray-100">
                  <td className="py-1 text-gray-500">{entry.rank}</td>
                  <td className="py-1 font-medium">{entry.playerName}</td>
                  <td className="py-1 text-right tabular-nums">{entry.points}</td>
                  <td className="py-1 text-right tabular-nums">{entry.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
