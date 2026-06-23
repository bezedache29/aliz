import { createStore } from 'jotai'

import type { FoodProduct } from '@/src/models/food/food.model'
import { addCustomFood, customFoodsAtom, searchCustomFoods } from '@/src/store/customFoodsAtom'

// Helpers
const makeFood = (overrides: Partial<FoodProduct> = {}): FoodProduct => ({
  id: 'manual-1',
  name: 'Riz basmati cuit',
  source: 'manual',
  per100g: { kcal: 130, proteines: 2.5, glucides: 28, lipides: 0.3 },
  ...overrides,
})

describe('customFoodsAtom', () => {
  it('initialise avec un tableau vide', () => {
    const store = createStore()
    expect(store.get(customFoodsAtom)).toEqual([])
  })

  it("stocke une liste d'aliments", () => {
    const store = createStore()
    const food = makeFood()
    store.set(customFoodsAtom, [food])
    expect(store.get(customFoodsAtom)).toHaveLength(1)
    expect(store.get(customFoodsAtom)[0].id).toBe('manual-1')
  })
})

describe('addCustomFood', () => {
  it('ajoute un aliment en tête de liste', () => {
    const existing = makeFood({ id: 'manual-0', name: 'Poulet rôti' })
    const newFood = makeFood({ id: 'manual-1', name: 'Riz basmati cuit' })
    const result = addCustomFood([existing], newFood)
    expect(result[0].id).toBe('manual-1')
    expect(result[1].id).toBe('manual-0')
  })

  it('ajoute dans une liste vide', () => {
    const food = makeFood()
    const result = addCustomFood([], food)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('manual-1')
  })

  it('déduplique par id — déplace en tête si déjà présent', () => {
    const food = makeFood({ id: 'manual-1', name: 'Riz basmati cuit' })
    const other = makeFood({ id: 'manual-2', name: 'Poulet rôti' })
    // food est déjà en position 1, on le ré-ajoute
    const result = addCustomFood([other, food], food)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('manual-1')
    expect(result[1].id).toBe('manual-2')
  })

  it('ne modifie pas le tableau source (immutabilité)', () => {
    const prev = [makeFood()]
    const newFood = makeFood({ id: 'manual-2', name: 'Poulet rôti' })
    addCustomFood(prev, newFood)
    expect(prev).toHaveLength(1)
  })
})

describe('searchCustomFoods', () => {
  const foods: FoodProduct[] = [
    makeFood({ id: '1', name: 'Riz basmati cuit', brand: undefined }),
    makeFood({ id: '2', name: 'Poulet rôti', brand: 'Label Rouge' }),
    makeFood({ id: '3', name: 'Pâtes complètes cuites', brand: undefined }),
    makeFood({ id: '4', name: 'Yaourt nature', brand: 'Danone' }),
  ]

  it('retourne tous les aliments si la query est vide', () => {
    expect(searchCustomFoods(foods, '')).toHaveLength(4)
  })

  it('retourne tous les aliments si la query ne contient que des espaces', () => {
    expect(searchCustomFoods(foods, '   ')).toHaveLength(4)
  })

  it('filtre par nom — insensible à la casse', () => {
    const result = searchCustomFoods(foods, 'riz')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filtre par nom — insensible aux accents', () => {
    // "pates" doit trouver "Pâtes complètes"
    const result = searchCustomFoods(foods, 'pates')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  it('filtre par marque', () => {
    const result = searchCustomFoods(foods, 'danone')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('4')
  })

  it('filtre par marque — insensible à la casse', () => {
    const result = searchCustomFoods(foods, 'LABEL')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('retourne un tableau vide si aucun résultat', () => {
    expect(searchCustomFoods(foods, 'quinoa')).toHaveLength(0)
  })

  it('gère les aliments sans marque sans planter', () => {
    const nobrands = [makeFood({ id: '1', name: 'Riz', brand: undefined })]
    expect(() => searchCustomFoods(nobrands, 'label')).not.toThrow()
    expect(searchCustomFoods(nobrands, 'label')).toHaveLength(0)
  })
})
