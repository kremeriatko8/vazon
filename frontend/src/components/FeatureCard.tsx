import type { ReactNode } from 'react'
import { StatusBadge } from './StatusBadge'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-beige bg-paper p-6 card-reveal shadow-botanical">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-100 text-forest-700">
          {icon}
        </span>
        <StatusBadge variant="planned" />
      </div>
      <h3 className="text-lg font-semibold text-forest-800">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-forest-700/80">{description}</p>
    </article>
  )
}
