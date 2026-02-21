import { useState } from 'react'
import type { GeneratedSchedule } from '../../types'

interface SchedulePreviewProps {
  schedule: GeneratedSchedule
  playerLabels: string[]
}

export function SchedulePreview({ schedule, playerLabels }: SchedulePreviewProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>Schedule Preview ({schedule.rounds.length} rounds)</span>
        <span className="text-gray-400">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 text-xs font-mono">
          {schedule.rounds.map(round => (
            <div key={round.roundNumber}>
              <div className="font-semibold text-gray-600 mb-1">Round {round.roundNumber}</div>
              {round.matches.map(match => (
                <div key={match.courtIndex} className="ml-4 text-gray-500">
                  Court {match.courtIndex + 1}:{' '}
                  <span className="text-team-blue">{playerLabels[parseInt(match.team1[0])] ?? match.team1[0]} & {playerLabels[parseInt(match.team1[1])] ?? match.team1[1]}</span>
                  {' vs '}
                  <span className="text-team-red">{playerLabels[parseInt(match.team2[0])] ?? match.team2[0]} & {playerLabels[parseInt(match.team2[1])] ?? match.team2[1]}</span>
                </div>
              ))}
              {round.pausedPlayerIds.length > 0 && (
                <div className="ml-4 text-yellow-600">
                  Paused: {round.pausedPlayerIds.map(id => playerLabels[parseInt(id)] ?? id).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
