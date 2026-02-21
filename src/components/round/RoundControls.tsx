import { Button } from '../shared'

interface RoundControlsProps {
  roundNumber: number
  totalRounds: number
  isComplete: boolean
  isConfirmed: boolean
  isLastRound: boolean
  openEnded?: boolean
  onPrev: () => void
  onNext: () => void
  onFinish: () => void
}

export function RoundControls({
  roundNumber, totalRounds, isComplete, isConfirmed, isLastRound, openEnded,
  onPrev, onNext, onFinish,
}: RoundControlsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="secondary"
        onClick={onPrev}
        disabled={roundNumber <= 1}
      >
        Previous
      </Button>

      <span className="text-sm text-gray-500 font-medium">
        Round {roundNumber}{openEnded ? '' : ` / ${totalRounds}`}
      </span>

      <div className="flex gap-2">
        {(openEnded || !isLastRound) && (
          <Button
            variant="secondary"
            onClick={onNext}
            disabled={!isComplete && !isConfirmed}
          >
            Next
          </Button>
        )}
        {(isLastRound || (openEnded && isComplete)) && (
          <Button variant="primary" onClick={onFinish}>
            Finish Tournament
          </Button>
        )}
      </div>
    </div>
  )
}
