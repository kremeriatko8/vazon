/**
 * Shared class names for the Vazon Plant Care design, so every page uses the
 * same buttons, fields and cards.
 */
export const ui = {
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-full bg-olive-800 px-5 py-2.5 text-sm font-semibold text-ivory transition hover:bg-olive-900 disabled:opacity-60',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-full border border-beige-dark bg-white px-5 py-2.5 text-sm font-medium text-forest-800 transition hover:bg-ivory disabled:opacity-60',
  btnDanger:
    'inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60',
  input:
    'mt-1.5 w-full rounded-xl border border-beige-dark bg-ivory/40 px-3.5 py-2.5 text-sm text-forest-900 focus:border-forest-600 focus:bg-white focus:outline-none',
  label: 'block text-sm font-medium text-forest-800',
  card: 'rounded-3xl border border-beige bg-white shadow-sm',
  chip: 'rounded-full bg-mint px-3 py-1 text-xs font-medium text-forest-800',
  error: 'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800',
  muted: 'text-sm text-forest-700/75',
}
