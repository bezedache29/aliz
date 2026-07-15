import type { WeightEntry } from '@/src/models/weight/weight.model'

export function getLatestWeightEntry(entries: WeightEntry[]): WeightEntry | null {
  const sorted = [...entries]
    .filter((e) => e.weight !== null && !!e.measuredAt)
    .sort((a, b) => (b.measuredAt < a.measuredAt ? -1 : b.measuredAt > a.measuredAt ? 1 : 0))
  return sorted[0] ?? null
}
