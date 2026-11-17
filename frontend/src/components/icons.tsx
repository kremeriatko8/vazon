/** Simple inline line icons (24×24, currentColor). No icon library needed yet. */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'h-5 w-5',
  'aria-hidden': true,
}

export const DropletIcon = () => (
  <svg {...base}>
    <path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3Z" />
  </svg>
)

export const CalendarIcon = () => (
  <svg {...base}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
  </svg>
)

export const SproutIcon = () => (
  <svg {...base}>
    <path d="M12 21v-9" />
    <path d="M12 12c0-4 2.7-6.7 7-7 0 4.3-2.7 7-7 7Z" />
    <path d="M12 14c0-3.3-2.3-5.5-6-6 0 3.5 2.3 6 6 6Z" />
  </svg>
)

export const CheckIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
)

export const HistoryIcon = () => (
  <svg {...base}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3.5 4v4h4M12 8v4l3 2" />
  </svg>
)

export const BellIcon = () => (
  <svg {...base}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </svg>
)
