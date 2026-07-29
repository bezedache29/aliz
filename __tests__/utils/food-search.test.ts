import type { FoodProduct } from '@/src/models/food/food.model'
import { searchCustomFoods } from '@/src/utils/food-search'

const makeFood = (overrides: Partial<FoodProduct> = {}): FoodProduct => ({
  id: 'manual-1',
  name: 'Riz basmati cuit',
  source: 'manual',
  per100g: { kcal: 130, proteines: 2.5, glucides: 28, lipides: 0.3 },
  ...overrides,
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
