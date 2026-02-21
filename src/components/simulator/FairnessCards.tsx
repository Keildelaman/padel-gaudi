import type { FairnessMetrics } from '../../types'

interface FairnessCardsProps {
  metrics: FairnessMetrics
}

interface MetricDisplay {
  label: string
  value: string
  level: 'good' | 'warn' | 'bad'
  tooltip: string
}

export function FairnessCards({ metrics }: FairnessCardsProps) {
  const items: MetricDisplay[] = [
    {
      label: 'Games Played StdDev',
      value: metrics.gamesPlayedStdDev.toFixed(2),
      level: metrics.gamesPlayedStdDev <= 0.5 ? 'good' : metrics.gamesPlayedStdDev <= 1 ? 'warn' : 'bad',
      tooltip: 'How evenly games are distributed. Lower is fairer — 0 means everyone played the same number of games.',
    },
    {
      label: 'Pause Count StdDev',
      value: metrics.pauseCountStdDev.toFixed(2),
      level: metrics.pauseCountStdDev <= 0.5 ? 'good' : metrics.pauseCountStdDev <= 1 ? 'warn' : 'bad',
      tooltip: 'How evenly sit-out rounds are distributed. Lower is fairer — 0 means everyone sat out equally.',
    },
    {
      label: 'Max Pause Gap',
      value: String(metrics.maxPauseGap),
      level: metrics.maxPauseGap <= 1 ? 'good' : metrics.maxPauseGap <= 2 ? 'warn' : 'bad',
      tooltip: 'Biggest difference in sit-out counts between any two players. Ideally 0 or 1.',
    },
    {
      label: 'Max Games Gap',
      value: String(metrics.maxGamesGap),
      level: metrics.maxGamesGap <= 1 ? 'good' : metrics.maxGamesGap <= 2 ? 'warn' : 'bad',
      tooltip: 'Biggest difference in games played between any two players. Ideally 0 or 1.',
    },
    {
      label: 'Partner Variety',
      value: (metrics.partnerVarietyIndex * 100).toFixed(0) + '%',
      level: metrics.partnerVarietyIndex >= 0.8 ? 'good' : metrics.partnerVarietyIndex >= 0.6 ? 'warn' : 'bad',
      tooltip: 'How evenly partner pairings are spread. 100% means every player partnered with every other equally often.',
    },
    {
      label: 'Opponent Variety',
      value: (metrics.opponentVarietyIndex * 100).toFixed(0) + '%',
      level: metrics.opponentVarietyIndex >= 0.8 ? 'good' : metrics.opponentVarietyIndex >= 0.6 ? 'warn' : 'bad',
      tooltip: 'How evenly opponent matchups are spread. 100% means every player faced every other equally often.',
    },
    {
      label: 'Partner Repeats',
      value: String(metrics.totalPartnerRepeats),
      level: metrics.totalPartnerRepeats === 0 ? 'good' : metrics.totalPartnerRepeats <= 3 ? 'warn' : 'bad',
      tooltip: 'Times the same two players were paired more than once. 0 is ideal.',
    },
    {
      label: 'Opponent Repeats',
      value: String(metrics.totalOpponentRepeats),
      level: metrics.totalOpponentRepeats === 0 ? 'good' : metrics.totalOpponentRepeats <= 5 ? 'warn' : 'bad',
      tooltip: 'Times two players faced each other more than once. 0 is ideal.',
    },
  ]

  const colorMap = {
    good: 'text-fair-good border-fair-good/30 bg-green-50',
    warn: 'text-fair-warn border-fair-warn/30 bg-yellow-50',
    bad: 'text-fair-bad border-fair-bad/30 bg-red-50',
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(item => (
        <div key={item.label} className={`relative group rounded-lg border p-3 text-center ${colorMap[item.level]}`}>
          <div className="absolute top-1.5 right-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/10 text-[10px] font-bold cursor-help opacity-60 group-hover:opacity-100 transition-opacity">?</span>
          </div>
          <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 font-normal text-left">
            {item.tooltip}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
          </div>
          <div className="text-xl font-bold tabular-nums">{item.value}</div>
          <div className="text-xs mt-1 opacity-80">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
