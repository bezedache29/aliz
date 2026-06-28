import { createStore } from 'jotai'

import { pendingIngredientAtom } from '@/src/store/pendingIngredientAtom'
import type { PendingIngredient } from '@/src/store/pendingIngredientAtom'
import type { FoodProduct } from '@/src/models/food/food.model'

const mockFood: FoodProduct = {
  id: 'ciqual-1',
  name: 'Blanc de poulet cuit',
  source: 'ciqual',
  per100g: { kcal: 165, proteines: 31, glucides: 0, lipides: 3.6 },
}

describe('pendingIngredientAtom', () => {
  it('a null comme valeur initiale', () => {
    const store = createStore()
    expect(store.get(pendingIngredientAtom)).toBeNull()
  })

  it('stocke un PendingIngredient avec les champs requis', () => {
    const store = createStore()
    const pending: PendingIngredient = { food: mockFood, quantityG: 150 }
    store.set(pendingIngredientAtom, pending)
    expect(store.get(pendingIngredientAtom)).toEqual(pending)
  })

  it('stocke un PendingIngredient avec tous les champs optionnels', () => {
    const store = createStore()
    const pending: PendingIngredient = {
      food: mockFood,
      quantityG: 100,
      unitCount: 2,
      unitWeightG: 50,
      displayUnit: 'unité',
    }
    store.set(pendingIngredientAtom, pending)
    expect(store.get(pendingIngredientAtom)).toEqual(pending)
  })

  it('peut être remis à null', () => {
    const store = createStore()
    store.set(pendingIngredientAtom, { food: mockFood, quantityG: 100 })
    store.set(pendingIngredientAtom, null)
    expect(store.get(pendingIngredientAtom)).toBeNull()
  })
})
