import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow border border-gray-200 transition-shadow ${padding ? 'p-4 sm:p-6' : ''} ${className}`}>
      {children}
    </div>
  )
}
