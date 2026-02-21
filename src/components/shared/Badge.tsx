import type { ReactNode } from 'react'

type BadgeColor = 'gray' | 'green' | 'blue' | 'red' | 'yellow' | 'gold' | 'silver' | 'bronze'

const colorClasses: Record<BadgeColor, string> = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  gold: 'bg-amber-100 text-amber-700',
  silver: 'bg-gray-200 text-gray-600',
  bronze: 'bg-orange-100 text-orange-700',
}

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
  className?: string
}

export function Badge({ children, color = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  )
}
