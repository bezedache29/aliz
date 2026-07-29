import { createStore } from 'jotai'

import dayjs from '@/src/config/dayjs'
import {
  openWeeklyGenerateSheetAtom,
  rejectedSuggestionsAtom,
  selectedDateAtom,
} from '@/src/store/planningAtom'

describe('selectedDateAtom', () => {
  it('initialise sur le jour courant', () => {
    const store = createStore()
    const value = store.get(selectedDateAtom)
    expect(value.format('YYYY-MM-DD')).toBe(dayjs().format('YYYY-MM-DD'))
  })

  it('se met à jour avec une nouvelle date', () => {
    const store = createStore()
    const newDate = dayjs('2026-01-15')
    store.set(selectedDateAtom, newDate)
    expect(store.get(selectedDateAtom).format('YYYY-MM-DD')).toBe('2026-01-15')
  })
})

describe('openWeeklyGenerateSheetAtom', () => {
  it('démarre à 0', () => {
    const store = createStore()
    expect(store.get(openWeeklyGenerateSheetAtom)).toBe(0)
  })

  it('s’incrémente à chaque demande d’ouverture', () => {
    const store = createStore()
    store.set(openWeeklyGenerateSheetAtom, (prev) => prev + 1)
    store.set(openWeeklyGenerateSheetAtom, (prev) => prev + 1)
    expect(store.get(openWeeklyGenerateSheetAtom)).toBe(2)
  })
})

describe('rejectedSuggestionsAtom — suggestions IA rejetées dans le Journal', () => {
  it('initialise avec un tableau vide', () => {
    const store = createStore()
    expect(store.get(rejectedSuggestionsAtom)).toEqual([])
  })

  it('mémorise la clé d’une suggestion rejetée', () => {
    const store = createStore()
    const key = '2026-01-15:Déjeuner:Plat'
    store.set(rejectedSuggestionsAtom, [key])
    expect(store.get(rejectedSuggestionsAtom)).toContain(key)
  })

  it('accumule plusieurs rejets indépendants', () => {
    const store = createStore()
    store.set(rejectedSuggestionsAtom, (prev) => [...prev, '2026-01-15:Déjeuner:Plat'])
    store.set(rejectedSuggestionsAtom, (prev) => [...prev, '2026-01-15:Dîner:'])
    expect(store.get(rejectedSuggestionsAtom)).toEqual([
      '2026-01-15:Déjeuner:Plat',
      '2026-01-15:Dîner:',
    ])
  })
})
