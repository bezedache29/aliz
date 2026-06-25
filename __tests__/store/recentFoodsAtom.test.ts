import { createStore } from 'jotai'

import type { FoodProduct } from '@/src/models/food/food.model'
import { addToRecent, recentFoodsAtom } from '@/src/store/recentFoodsAtom'

const makeFood = (overrides: Partial<FoodProduct> = {}): FoodProduct => ({
  id: 'off-1',
  name: 'Yaourt nature',
  source: 'openfoodfacts',
  per100g: { kcal: 60, proteines: 4, glucides: 6, lipides: 2 },
  ...overrides,
})

describe('recentFoodsAtom', () => {
  it('initialise avec un tableau vide', () => {
    const store = createStore()
    expect(store.get(recentFoodsAtom)).toEqual([])
  })

  it('accepte une liste mise à jour directement', () => {
    const store = createStore()
    const food = makeFood()
    store.set(recentFoodsAtom, [food])
    expect(store.get(recentFoodsAtom)).toHaveLength(1)
    expect(store.get(recentFoodsAtom)[0].id).toBe('off-1')
  })
})

describe('addToRecent', () => {
  it('ajoute un aliment en tête de liste', () => {
    const existing = makeFood({ id: 'off-0', name: 'Riz basmati' })
    const newFood = makeFood({ id: 'off-1', name: 'Yaourt nature' })
    const result = addToRecent([existing], newFood)
    expect(result[0].id).toBe('off-1')
    expect(result[1].id).toBe('off-0')
  })

  it('ajoute dans une liste vide', () => {
    const food = makeFood()
    const result = addToRecent([], food)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('off-1')
  })

  it('déduplique par id — déplace en tête si déjà présent', () => {
    const food = makeFood({ id: 'off-1' })
    const other = makeFood({ id: 'off-2', name: 'Poulet rôti' })
    const result = addToRecent([other, food], food)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('off-1')
    expect(result[1].id).toBe('off-2')
  })

  it('ne modifie pas le tableau source (immutabilité)', () => {
    const prev = [makeFood()]
    const newFood = makeFood({ id: 'off-2', name: 'Poulet rôti' })
    addToRecent(prev, newFood)
    expect(prev).toHaveLength(1)
  })

  it('tronque à 50 éléments maximum', () => {
    // Construit une liste de 50 aliments existants
    const prev: FoodProduct[] = Array.from({ length: 50 }, (_, i) =>
      makeFood({ id: `old-${i}`, name: `Aliment ${i}` }),
    )
    const result = addToRecent(prev, makeFood({ id: 'new-1', name: 'Nouveau' }))
    expect(result).toHaveLength(50)
    expect(result[0].id).toBe('new-1')
    // Le 50e de l'ancienne liste (indice 49) est sorti
    expect(result.find((f) => f.id === 'old-49')).toBeUndefined()
  })

  it('ne tronque pas si la liste fait exactement 49 éléments avant ajout', () => {
    const prev: FoodProduct[] = Array.from({ length: 49 }, (_, i) =>
      makeFood({ id: `old-${i}`, name: `Aliment ${i}` }),
    )
    const result = addToRecent(prev, makeFood({ id: 'new-1', name: 'Nouveau' }))
    expect(result).toHaveLength(50)
  })
})
