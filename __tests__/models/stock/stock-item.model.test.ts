import { isExpiringSoon } from '@/src/models/stock/stock-item.model'
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
