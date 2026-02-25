import { Button } from '../shared'
import { useT } from '../../i18n'

interface RoundControlsProps {
  roundNumber: number
  totalRounds: number
  isComplete: boolean
  isConfirmed: boolean
  isLastRound: boolean
  openEnded?: boolean
  isEqualizerRound?: boolean
  equalizerProgress?: { current: number; total: number }
  hasMoreEqualizers?: boolean
  equalizerRoundsNeeded?: number
  onPrev: () => void
  onNext: () => void
  onFinish: () => void
  onNextEqualizer?: () => void
  onStartEqualizer?: () => void
}

export function RoundControls({
  roundNumber, totalRounds, isComplete, isConfirmed, isLastRound, openEnded,
  isEqualizerRound, equalizerProgress, hasMoreEqualizers, equalizerRoundsNeeded,
  onPrev, onNext, onFinish, onNextEqualizer, onStartEqualizer,
}: RoundControlsProps) {
  const { t } = useT()
  const totalPart = openEnded ? '' : t('roundControls.roundOf', { n: totalRounds })

  const label = isEqualizerRound
    ? equalizerProgress
      ? t('equalizer.progress', { current: equalizerProgress.current, total: equalizerProgress.total })
      : t('equalizer.roundLabel')
    : t('roundControls.round', { current: roundNumber, total: totalPart })

  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="secondary"
        onClick={onPrev}
        disabled={roundNumber <= 1 || isEqualizerRound}
      >
        {t('roundControls.previous')}
      </Button>

      <span className="text-sm text-text-muted font-medium">
        {label}
      </span>

      <div className="flex gap-2">
        {!isEqualizerRound && (openEnded || !isLastRound) && (
          <Button
            variant="secondary"
            onClick={onNext}
            disabled={!isComplete && !isConfirmed}
          >
            {t('roundControls.next')}
          </Button>
        )}
        {isEqualizerRound && hasMoreEqualizers && (isComplete || isConfirmed) && (
          <Button variant="secondary" onClick={onNextEqualizer}>
            {t('equalizer.nextEqualizer')}
          </Button>
        )}
        {!isEqualizerRound && equalizerRoundsNeeded && equalizerRoundsNeeded > 0 && (isLastRound || (openEnded && isComplete)) && (
          <Button variant="secondary" onClick={onStartEqualizer} disabled={!isComplete && !isConfirmed}>
            {t('roundControls.playEqualizer', { count: equalizerRoundsNeeded })}
          </Button>
        )}
        {(isLastRound || isEqualizerRound || (openEnded && isComplete)) && (
          <Button variant="primary" onClick={onFinish} disabled={!isComplete && !isConfirmed}>
            {t('roundControls.finishTournament')}
          </Button>
        )}
      </div>
    </div>
  )
}
