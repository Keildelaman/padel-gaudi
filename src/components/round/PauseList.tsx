import { Badge } from '../shared'

interface PauseListProps {
  playerNames: string[]
}

export function PauseList({ playerNames }: PauseListProps) {
  if (playerNames.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-500">Sitting out:</span>
      {playerNames.map(name => (
        <Badge key={name} color="yellow">{name}</Badge>
      ))}
    </div>
  )
}
