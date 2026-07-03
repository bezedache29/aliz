import { createStore } from 'jotai'

import { type WeightEntry } from '@/src/models/weight/weight.model'
import { weightHistoryAtom } from '@/src/store/weightAtom'

const makeEntry = (overrides: Partial<WeightEntry> = {}): WeightEntry => ({
  id: '1',
  measuredAt: '2026-06-25T07:00:00.000Z',
  weight: 75.5,
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
})

describe('weightHistoryAtom', () => {
  it('initialise avec un tableau vide', () => {
    const store = createStore()
    expect(store.get(weightHistoryAtom)).toEqual([])
  })

  it('stocke une liste de pesées', () => {
    const store = createStore()
    const entry = makeEntry()
    store.set(weightHistoryAtom, [entry])
    expect(store.get(weightHistoryAtom)).toHaveLength(1)
    expect(store.get(weightHistoryAtom)[0].weight).toBe(75.5)
  })

  it('ajoute une pesée à la liste existante', () => {
    const store = createStore()
    const first = makeEntry({ id: '1', weight: 76.0 })
    store.set(weightHistoryAtom, [first])

    const second = makeEntry({ id: '2', weight: 75.5, measuredAt: '2026-06-26T07:00:00.000Z' })
    store.set(weightHistoryAtom, (prev) => [...prev, second])

    expect(store.get(weightHistoryAtom)).toHaveLength(2)
  })

  it('supprime une pesée par id', () => {
    const store = createStore()
    const entries = [makeEntry({ id: '1', weight: 76.0 }), makeEntry({ id: '2', weight: 75.5 })]
    store.set(weightHistoryAtom, entries)

    store.set(weightHistoryAtom, (prev) => prev.filter((e) => e.id !== '1'))

    const result = store.get(weightHistoryAtom)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('préserve tous les champs de la pesée', () => {
    const store = createStore()
    const entry = makeEntry({
      id: 'abc',
      measuredAt: '2026-06-25T07:00:00.000Z',
      weight: 74.2,
      bodyfat: 18.5,
      muscle: 32.1,
      bmi: 24.1,
      water: 55.2,
      bone: 3.4,
      bmr: 1800.0,
      protein: 14.0,
      bodyAge: 40.0,
      heartRate: 68.0,
    })
    store.set(weightHistoryAtom, [entry])

    const saved = store.get(weightHistoryAtom)[0]
    expect(saved.bodyfat).toBe(18.5)
    expect(saved.muscle).toBe(32.1)
    expect(saved.bmi).toBe(24.1)
  })
})
