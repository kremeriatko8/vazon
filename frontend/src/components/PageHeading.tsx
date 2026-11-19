import { Leaf } from 'lucide-react'

interface PageHeadingProps {
  kicker: string
  title: string
  accent?: string
  description?: string
}

/** Page title from the "Extend Design Across Pages" design: kicker, serif title, italic olive accent. */
export function PageHeading({ kicker, title, accent, description }: PageHeadingProps) {
  return (
    <div className="page-heading">
      <div className="app-kicker">
        <Leaf size={14} aria-hidden="true" />
        {kicker}
      </div>
      <h1>
        {title} {accent && <em>{accent}</em>}
      </h1>
      {description && <p>{description}</p>}
    </div>
  )
}
