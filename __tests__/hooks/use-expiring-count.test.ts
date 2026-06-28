import { renderHook } from '@testing-library/react-native'

import { useExpiringCount } from '@/src/hooks/use-expiring-count'
import type { StockItem } from '@/src/models/stock/stock-item.model'
import { useStock } from '@/src/apis/backendApi/hooks/stock/useStock'

jest.mock('@/src/apis/backendApi/hooks/stock/useStock')
const mockedUseStock = useStock as jest.MockedFunction<typeof useStock>

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
  jest.clearAllMocks()
})

describe('useExpiringCount', () => {
  it('retourne 0 quand le stock est vide', async () => {
    mockedUseStock.mockReturnValue({ data: [] } as any)
    const { result } = await renderHook(() => useExpiringCount())
    expect(result.current).toBe(0)
  })

  it('compte les articles expirés (date dépassée)', async () => {
    // expiryDate hier → status 'expired'
    mockedUseStock.mockReturnValue({
      data: [makeItem({ expiryDate: '2026-06-28' })],
    } as any)
    const { result } = await renderHook(() => useExpiringCount())
    expect(result.current).toBe(1)
  })

  it('compte les articles critiques (≤ 2 jours)', async () => {
    // demain → status 'critical'
    mockedUseStock.mockReturnValue({
      data: [makeItem({ expiryDate: '2026-06-30' })],
    } as any)
    const { result } = await renderHook(() => useExpiringCount())
    expect(result.current).toBe(1)
  })

  it('compte les articles en alerte (≤ 7 jours)', async () => {
    // dans 5 jours → status 'warning'
    mockedUseStock.mockReturnValue({
      data: [makeItem({ expiryDate: '2026-07-04' })],
    } as any)
    const { result } = await renderHook(() => useExpiringCount())
    expect(result.current).toBe(1)
  })

  it("n'inclut pas les articles OK (> 7 jours)", async () => {
    // dans 15 jours → status 'ok'
    mockedUseStock.mockReturnValue({
      data: [makeItem({ expiryDate: '2026-07-14' })],
    } as any)
    const { result } = await renderHook(() => useExpiringCount())
    expect(result.current).toBe(0)
  })

  it("n'inclut pas les articles sans date de péremption", async () => {
    mockedUseStock.mockReturnValue({
      data: [makeItem({ expiryDate: undefined })],
    } as any)
    const { result } = await renderHook(() => useExpiringCount())
    expect(result.current).toBe(0)
  })

  it('agrège correctement plusieurs articles avec des statuts mixtes', async () => {
    mockedUseStock.mockReturnValue({
      data: [
        makeItem({ id: 'a', expiryDate: '2026-06-28' }), // expired → compté
        makeItem({ id: 'b', expiryDate: '2026-06-30' }), // critical → compté
        makeItem({ id: 'c', expiryDate: '2026-07-04' }), // warning → compté
        makeItem({ id: 'd', expiryDate: '2026-07-14' }), // ok → non compté
        makeItem({ id: 'e', expiryDate: undefined }), // pas de date → non compté
      ],
    } as any)
    const { result } = await renderHook(() => useExpiringCount())
    expect(result.current).toBe(3)
  })
})
