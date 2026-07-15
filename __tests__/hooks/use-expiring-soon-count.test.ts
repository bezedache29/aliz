import { renderHook } from '@testing-library/react-native'

import { useExpiringSoonCount } from '@/src/hooks/use-expiring-soon-count'
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

describe('useExpiringSoonCount', () => {
  it('retourne 0 quand le stock est vide', async () => {
    mockedUseStock.mockReturnValue({ data: [] } as any)
    const { result } = await renderHook(() => useExpiringSoonCount())
    expect(result.current).toBe(0)
  })

  it('compte les articles expirant dans les 3 prochains jours (dont déjà expirés)', async () => {
    mockedUseStock.mockReturnValue({
      data: [
        makeItem({ id: 'a', expiryDate: '2026-06-28' }), // expiré → compté
        makeItem({ id: 'b', expiryDate: '2026-06-30' }), // dans 1 jour → compté
        makeItem({ id: 'c', expiryDate: '2026-07-05' }), // dans 6 jours → non compté
        makeItem({ id: 'd', expiryDate: undefined }), // pas de date → non compté
      ],
    } as any)
    const { result } = await renderHook(() => useExpiringSoonCount())
    expect(result.current).toBe(2)
  })
})
