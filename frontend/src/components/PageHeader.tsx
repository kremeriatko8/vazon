import { Leaf } from 'lucide-react'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  kicker: string
  title: string
  /** Italic second part of the title, in olive. */
  titleEm?: string
  lead?: string
  /** Buttons on the right. */
  children?: ReactNode
}

/** Page title in the Vazon Plant Care style: small kicker, serif title with an italic accent. */
export function PageHeader({ kicker, title, titleEm, lead, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-olive-800 uppercase">
          <Leaf size={15} aria-hidden="true" /> {kicker}
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight font-medium text-ink sm:text-4xl">
          {title}
          {titleEm && (
            <>
              {' '}
              <em className="text-olive-600">{titleEm}</em>
            </>
          )}
        </h1>
        {lead && <p className="mt-2 max-w-xl text-sm text-forest-700/80">{lead}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </div>
  )
}
