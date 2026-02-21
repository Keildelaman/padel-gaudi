import { useTournament, getLeaderboard } from '../state'
import { Card, Button } from '../components/shared'
import { PodiumGraphic } from '../components/leaderboard/PodiumGraphic'
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable'
import { leaderboardToCsv, leaderboardToText, downloadFile } from '../utils/export'

export function LeaderboardPage() {
  const { state, dispatch } = useTournament()
  const tournament = state.tournament

  if (!tournament) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No tournament data available.</p>
        <button
          className="mt-3 text-primary hover:underline"
          onClick={() => dispatch({ type: 'NAVIGATE_PAGE', payload: { page: 'setup' } })}
        >
          Go to Setup
        </button>
      </div>
    )
  }

  const leaderboard = getLeaderboard(tournament)
  const top3 = leaderboard.slice(0, 3)
  const completedRounds = tournament.rounds.filter(r => r.completed).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold border-l-4 border-primary pl-3">
          {tournament.phase === 'finished' ? 'Final Results' : 'Current Standings'}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="text-xs !px-3 !py-1.5"
            onClick={() => downloadFile(leaderboardToCsv(leaderboard), `${tournament.name}-results.csv`, 'text/csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            className="text-xs !px-3 !py-1.5"
            onClick={() => {
              const text = leaderboardToText(leaderboard)
              navigator.clipboard.writeText(text)
            }}
          >
            Copy Text
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{tournament.players.length}</div>
            <div className="text-xs text-gray-500">Players</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{completedRounds}</div>
            <div className="text-xs text-gray-500">Rounds Played</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{tournament.courts}</div>
            <div className="text-xs text-gray-500">Courts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {tournament.scoringConfig.mode === 'points' ? `${tournament.scoringConfig.pointsPerMatch}pts` : 'W/L'}
            </div>
            <div className="text-xs text-gray-500">Scoring</div>
          </div>
        </div>
      </Card>

      {/* Podium */}
      {tournament.phase === 'finished' && top3.length >= 3 && (
        <Card>
          <PodiumGraphic top3={top3} />
        </Card>
      )}

      {/* Table */}
      <Card padding={false}>
        <LeaderboardTable entries={leaderboard} tournament={tournament} />
      </Card>

      {/* Actions */}
      {tournament.phase === 'finished' && (
        <div className="flex justify-center">
          <Button variant="destructive" onClick={() => dispatch({ type: 'RESET_TOURNAMENT' })}>
            New Tournament
          </Button>
        </div>
      )}
    </div>
  )
}
