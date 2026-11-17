type BadgeVariant = 'planned' | 'soon' | 'live'

const styles: Record<BadgeVariant, string> = {
  planned: 'bg-beige text-forest-700 ring-beige-dark',
  soon: 'bg-sage-100 text-forest-700 ring-sage-300',
  live: 'bg-forest-700 text-ivory ring-forest-700',
}

const labels: Record<BadgeVariant, string> = {
  planned: 'Planned',
  soon: 'Coming soon',
  live: 'Working now',
}

interface StatusBadgeProps {
  variant: BadgeVariant
  label?: string
}

/** Small pill that tells the reader whether a feature exists yet. */
export function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[variant]}`}
    >
      {label ?? labels[variant]}
    </span>
  )
}
