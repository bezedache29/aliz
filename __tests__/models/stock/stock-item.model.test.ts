import {
  buildStockDeduction,
  computeStockRestoration,
  deductStockQuantity,
  findMatchingStockItem,
  isExpiringSoon,
  stockItemToFoodProduct,
} from '@/src/models/stock/stock-item.model'
import type { StockItem } from '@/src/models/stock/stock-item.model'

// Date fixée au 2026-06-29 pour des assertions déterministes
const FIXED_NOW = new Date('2026-06-29T00:00:00Z').getTime()

function makeItem(overrides: Partial<StockItem>): StockItem {
  return {
    id: 'item-1',
    name: 'Aliment test',
    quantity: 1,
    unit: 'pièce(s)',
    category: 'Frais',
    source: 'manual',
    addedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('isExpiringSoon', () => {
  it("retourne false quand l'article n'a pas de date de péremption", () => {
    expect(isExpiringSoon(makeItem({ expiryDate: undefined }), 3)).toBe(false)
  })

  it('retourne true pour un article déjà expiré', () => {
    expect(isExpiringSoon(makeItem({ expiryDate: '2026-06-28' }), 3)).toBe(true)
  })

  it('retourne true pour un article expirant sous peu (dans la fenêtre maxDays)', () => {
    expect(isExpiringSoon(makeItem({ expiryDate: '2026-06-30' }), 3)).toBe(true)
  })

  it('retourne false pour un article expirant bien au-delà de maxDays jours', () => {
    expect(isExpiringSoon(makeItem({ expiryDate: '2026-07-05' }), 3)).toBe(false)
  })
})

describe('stockItemToFoodProduct', () => {
  const per100g = { kcal: 130, proteines: 2.5, glucides: 28, lipides: 0.3 }

  it('retourne null quand per100g est absent', () => {
    expect(stockItemToFoodProduct(makeItem({ per100g: undefined }))).toBeNull()
  })

  it('mappe les champs correctement quand per100g est présent', () => {
    const food = stockItemToFoodProduct(
      makeItem({ name: 'Riz basmati', brand: 'Uncle Ben', per100g }),
    )
    expect(food).toEqual({
      id: 'item-1',
      name: 'Riz basmati',
      brand: 'Uncle Ben',
      source: 'manual',
      per100g,
    })
  })
})

describe('deductStockQuantity', () => {
  const per100g = { kcal: 130, proteines: 2.5, glucides: 28, lipides: 0.3 }

  it('déduit correctement pour une unité de poids (g)', () => {
    const item = makeItem({ quantity: 500, unit: 'g', per100g })
    expect(deductStockQuantity(item, 200)).toBe(300)
  })

  it('convertit kg en grammes avant déduction', () => {
    const item = makeItem({ quantity: 1, unit: 'kg', per100g })
    expect(deductStockQuantity(item, 250)).toBe(0.75)
  })

  it('convertit L en grammes/ml avant déduction', () => {
    const item = makeItem({ quantity: 1, unit: 'L', per100g })
    expect(deductStockQuantity(item, 250)).toBe(0.75)
  })

  it('ne descend jamais sous zéro (unité de poids)', () => {
    const item = makeItem({ quantity: 100, unit: 'g', per100g })
    expect(deductStockQuantity(item, 500)).toBe(0)
  })

  it('déduit par unitCount pour une unité au compteur quand fourni', () => {
    const item = makeItem({ quantity: 6, unit: 'pièce(s)', per100g })
    expect(deductStockQuantity(item, 300, 2)).toBe(4)
  })

  it('ne descend jamais sous zéro (unité au compteur avec unitCount)', () => {
    const item = makeItem({ quantity: 2, unit: 'pièce(s)', per100g })
    expect(deductStockQuantity(item, 300, 5)).toBe(0)
  })

  it('approxime 1 unité ≈ 100g quand unitCount est absent (unité au compteur)', () => {
    const item = makeItem({ quantity: 6, unit: 'pièce(s)', per100g })
    expect(deductStockQuantity(item, 250)).toBe(3.5)
  })
})

describe('findMatchingStockItem', () => {
  it("trouve l'article par id exact", () => {
    const item = makeItem({ id: 'stock-1', name: 'Riz basmati' })
    expect(findMatchingStockItem([item], { id: 'stock-1', name: 'Autre nom' })).toBe(item)
  })

  it('trouve l’article par foodProductId', () => {
    const item = makeItem({ id: 'stock-1', foodProductId: 'off-42', name: 'Riz basmati' })
    expect(findMatchingStockItem([item], { id: 'off-42', name: 'Autre nom' })).toBe(item)
  })

  it('retombe sur une correspondance par nom, insensible à la casse et aux accents', () => {
    const item = makeItem({ id: 'stock-1', name: 'Pâtes complètes' })
    expect(findMatchingStockItem([item], { id: 'recipe-food-1', name: 'pates completes' })).toBe(
      item,
    )
  })

  it('retourne undefined si aucune correspondance', () => {
    const item = makeItem({ id: 'stock-1', name: 'Riz basmati' })
    expect(findMatchingStockItem([item], { id: 'x', name: 'Quinoa' })).toBeUndefined()
  })

  it('en cas d’homonymes, priorise celui dont la DLC est la plus proche (FEFO)', () => {
    const soon = makeItem({ id: 'stock-soon', name: 'Yaourt', expiryDate: '2026-06-30' })
    const later = makeItem({ id: 'stock-later', name: 'Yaourt', expiryDate: '2026-07-15' })
    expect(findMatchingStockItem([later, soon], { id: 'x', name: 'Yaourt' })).toBe(soon)
  })

  it('en cas d’homonymes, priorise ceux avec DLC sur ceux sans', () => {
    const noExpiry = makeItem({ id: 'stock-no-expiry', name: 'Riz', expiryDate: undefined })
    const withExpiry = makeItem({ id: 'stock-with-expiry', name: 'Riz', expiryDate: '2026-07-10' })
    expect(findMatchingStockItem([noExpiry, withExpiry], { id: 'x', name: 'Riz' })).toBe(withExpiry)
  })
})

describe('buildStockDeduction', () => {
  it('capture le stockItemId, la quantité déduite et un instantané sans id/addedAt/quantity', () => {
    const item = makeItem({
      id: 'stock-1',
      name: 'Riz basmati',
      brand: 'Uncle Ben',
      quantity: 500,
      unit: 'g',
      addedAt: '2026-01-01T00:00:00Z',
    })
    const deduction = buildStockDeduction(item, 200)
    expect(deduction.stockItemId).toBe('stock-1')
    expect(deduction.quantityDeducted).toBe(200)
    expect(deduction.itemSnapshot).toEqual({
      name: 'Riz basmati',
      brand: 'Uncle Ben',
      unit: 'g',
      category: 'Frais',
      source: 'manual',
    })
  })
})

describe('computeStockRestoration', () => {
  it("restaure en mise à jour si l'article existe toujours", () => {
    const item = makeItem({ id: 'stock-1', quantity: 300 })
    const deduction = buildStockDeduction(makeItem({ id: 'stock-1', quantity: 500 }), 200)
    const restoration = computeStockRestoration(deduction, [item])
    expect(restoration).toEqual({ action: 'update', item: { ...item, quantity: 500 } })
  })

  it("recrée l'article à partir de l'instantané si l'article a été supprimé (épuisé)", () => {
    const original = makeItem({
      id: 'stock-1',
      name: 'Riz basmati',
      unit: 'g',
      quantity: 200,
    })
    const deduction = buildStockDeduction(original, 200)
    const restoration = computeStockRestoration(deduction, [])
    expect(restoration.action).toBe('create')
    expect(restoration.item).toEqual({
      name: 'Riz basmati',
      unit: 'g',
      category: 'Frais',
      source: 'manual',
      quantity: 200,
    })
  })
})
