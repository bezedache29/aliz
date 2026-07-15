import { getLatestWeightEntry } from '@/src/utils/weight'
import type { WeightEntry } from '@/src/models/weight/weight.model'

function makeEntry(overrides: Partial<WeightEntry> = {}): WeightEntry {
  return {
    id: 'w-1',
    measuredAt: '2026-07-10T08:00:00.000Z',
    weight: 80,
    bmi: null,
    bodyfat: null,
    water: null,
    muscle: null,
    bone: null,
    bmr: null,
    protein: null,
    bodyAge: null,
    heartRate: null,
    ...overrides,
  }
}

describe('getLatestWeightEntry', () => {
  it('retourne null pour une liste vide', () => {
    expect(getLatestWeightEntry([])).toBeNull()
  })

  it('retourne la seule entrée disponible', () => {
    const entry = makeEntry()
    expect(getLatestWeightEntry([entry])).toEqual(entry)
  })

  it('retourne l’entrée la plus récente parmi plusieurs, peu importe l’ordre', () => {
    const oldest = makeEntry({ id: 'w-1', measuredAt: '2026-07-01T08:00:00.000Z', weight: 85 })
    const latest = makeEntry({ id: 'w-2', measuredAt: '2026-07-14T08:00:00.000Z', weight: 82 })
    const middle = makeEntry({ id: 'w-3', measuredAt: '2026-07-08T08:00:00.000Z', weight: 83 })

    expect(getLatestWeightEntry([oldest, latest, middle])).toEqual(latest)
    expect(getLatestWeightEntry([latest, middle, oldest])).toEqual(latest)
  })

  it('ignore les entrées sans poids', () => {
    const noWeight = makeEntry({ id: 'w-1', measuredAt: '2026-07-14T08:00:00.000Z', weight: null })
    const withWeight = makeEntry({ id: 'w-2', measuredAt: '2026-07-01T08:00:00.000Z', weight: 78 })

    expect(getLatestWeightEntry([noWeight, withWeight])).toEqual(withWeight)
  })

  it('ignore les entrées sans date de mesure', () => {
    const noDate = makeEntry({ id: 'w-1', measuredAt: '', weight: 90 })
    const withDate = makeEntry({ id: 'w-2', measuredAt: '2026-07-01T08:00:00.000Z', weight: 78 })

    expect(getLatestWeightEntry([noDate, withDate])).toEqual(withDate)
  })
})
