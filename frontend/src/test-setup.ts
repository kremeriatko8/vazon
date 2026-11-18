import '@testing-library/jest-dom/vitest'
const mapWithGroupBy = Map as typeof Map & {
  groupBy?: <K, T>(items: Iterable<T>, keySelector: (item: T, index: number) => K) => Map<K, T[]>
}
if (!mapWithGroupBy.groupBy) {
  mapWithGroupBy.groupBy = <K, T>(items: Iterable<T>, keySelector: (item: T, index: number) => K) => {
    const map = new Map<K, T[]>()
    let i = 0
    for (const item of items) {
      const key = keySelector(item, i++)
      const list = map.get(key)
      if (list) list.push(item)
      else map.set(key, [item])
    }
    return map
  }
}
