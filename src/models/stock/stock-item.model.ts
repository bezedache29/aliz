export const STOCK_CATEGORIES = ['Frais', 'Sec', 'Conserve', 'Surgelé'] as const
export type StockCategory = (typeof STOCK_CATEGORIES)[number]

export const STOCK_ITEM_STATES = ['cru', 'cuit', 'ouvert', 'préparé', 'surgelé'] as const
export type StockItemState = (typeof STOCK_ITEM_STATES)[number]

export const STOCK_UNITS = [
  'pièce(s)',
  'g',
  'kg',
  'ml',
  'L',
  'boîte(s)',
  'sachet(s)',
  'tranche(s)',
  'portion(s)',
] as const
export type StockUnit = (typeof STOCK_UNITS)[number]

export interface StockItem {
  id: string
  name: string
  brand?: string
  quantity: number
  unit: string
  category: StockCategory
  state?: StockItemState
  expiryDate?: string
  per100g?: {
    kcal: number
    proteines: number
    glucides: number
    lipides: number
    fibres?: number
    sel?: number
  }
  source: 'openfoodfacts' | 'ciqual' | 'aprifel' | 'custom' | 'manual'
  foodProductId?: string
  addedAt: string
}

export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'ok'

export function getDaysUntilExpiry(item: StockItem): number | null {
  if (!item.expiryDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(item.expiryDate)
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getExpiryStatus(item: StockItem): ExpiryStatus | null {
  const days = getDaysUntilExpiry(item)
  if (days === null) return null
  if (days < 0) return 'expired'
  if (days <= 2) return 'critical'
  if (days <= 7) return 'warning'
  return 'ok'
}
