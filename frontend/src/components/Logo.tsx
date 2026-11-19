import { Link } from 'react-router-dom'

interface LogoProps {
  className?: string
  /** White text, for dark backgrounds. */
  light?: boolean
}

export function LeafMark({ className = 'h-8 w-8' }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-forest-700" />
      <path d="M16 25V14" className="stroke-ivory" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 15c0-4.5 3-7.5 8-8 0 5-3 8-8 8Z" className="fill-sage-400" />
      <path d="M16 18c0-3.5-2.5-6-6.5-6.5 0 4 2.5 6.5 6.5 6.5Z" className="fill-sage-300" />
    </svg>
  )
}

export function Logo({ className = '', light = false }: LogoProps) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="Vazon home">
      <LeafMark />
      <span className={`font-display text-xl font-semibold tracking-tight ${light ? 'text-white' : 'text-forest-800'}`}>Vazon</span>
    </Link>
  )
}
