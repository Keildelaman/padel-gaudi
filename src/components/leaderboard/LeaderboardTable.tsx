import { useState } from 'react'
import type { LeaderboardEntry, Tournament } from '../../types'
import { Badge } from '../shared'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  tournament: Tournament
}

export function LeaderboardTable({ entries, tournament }: LeaderboardTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const playerMap = new Map(tournament.players.map(p => [p.id, p.name]))

  const rankBadge = (rank: number) => {
    if (rank === 1) return <Badge color="gold">1st</Badge>
    if (rank === 2) return <Badge color="silver">2nd</Badge>
    if (rank === 3) return <Badge color="bronze">3rd</Badge>
    return <span className="text-gray-500 text-sm">{rank}</span>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
            <th className="text-left py-3 px-2">Rank</th>
            <th className="text-left py-3 px-2">Player</th>
            <th className="text-right py-3 px-2">Points</th>
            <th className="text-right py-3 px-2">W</th>
            <th className="text-right py-3 px-2">L</th>
            <th className="text-right py-3 px-2 hidden sm:table-cell">Played</th>
            <th className="text-right py-3 px-2 hidden sm:table-cell">Paused</th>
            <th className="text-right py-3 px-2 hidden md:table-cell">+/-</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <>
              <tr
                key={entry.playerId}
                onClick={() => setExpandedId(expandedId === entry.playerId ? null : entry.playerId)}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <td className="py-3 px-2">{rankBadge(entry.rank)}</td>
                <td className="py-3 px-2 font-medium">{entry.playerName}</td>
                <td className="py-3 px-2 text-right tabular-nums font-semibold">{entry.points}</td>
                <td className="py-3 px-2 text-right tabular-nums text-green-600">{entry.wins}</td>
                <td className="py-3 px-2 text-right tabular-nums text-red-600">{entry.losses}</td>
                <td className="py-3 px-2 text-right tabular-nums hidden sm:table-cell">{entry.gamesPlayed}</td>
                <td className="py-3 px-2 text-right tabular-nums hidden sm:table-cell">{entry.gamesPaused}</td>
                <td className="py-3 px-2 text-right tabular-nums hidden md:table-cell">
                  <span className={entry.pointDifferential > 0 ? 'text-green-600' : entry.pointDifferential < 0 ? 'text-red-600' : ''}>
                    {entry.pointDifferential > 0 ? '+' : ''}{entry.pointDifferential}
                  </span>
                </td>
              </tr>
              {expandedId === entry.playerId && (
                <tr key={`${entry.playerId}-detail`}>
                  <td colSpan={8} className="px-4 py-3 bg-gray-50">
                    <div className="text-xs space-y-1">
                      {entry.roundResults.map(rr => (
                        <div key={rr.roundNumber} className="flex items-center gap-2">
                          <span className="text-gray-400 w-12">R{rr.roundNumber}:</span>
                          {rr.paused ? (
                            <Badge color="yellow">Paused</Badge>
                          ) : (
                            <>
                              <span>w/ {playerMap.get(rr.partnerId!) ?? '?'}</span>
                              <span className="text-gray-400">vs</span>
                              <span>{rr.opponentIds?.map(id => playerMap.get(id) ?? '?').join(' & ')}</span>
                              {rr.won != null && (
                                <Badge color={rr.won ? 'green' : 'red'}>{rr.won ? 'W' : 'L'}</Badge>
                              )}
                              {rr.pointsScored != null && (
                                <span className="text-gray-500 tabular-nums">{rr.pointsScored}-{rr.pointsConceded}</span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
