import { FoodProduct } from '@/src/models/food/food.model'

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

export function isExpiringSoon(item: StockItem, maxDays: number): boolean {
  const days = getDaysUntilExpiry(item)
  return days !== null && days <= maxDays
}

export function stockItemToFoodProduct(item: StockItem): FoodProduct | null {
  if (!item.per100g) return null
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    source: 'manual',
    per100g: item.per100g,
  }
}

// Facteur de conversion vers grammes pour les unités de poids/volume — les unités
// au compteur (pièce(s), boîte(s)...) n'ont pas d'équivalence fixe et sont gérées à part.
const WEIGHT_VOLUME_TO_GRAMS: Record<string, number> = { g: 1, kg: 1000, ml: 1, L: 1000, cl: 10 }

export function deductStockQuantity(
  item: StockItem,
  gramsConsumed: number,
  unitCountConsumed?: number,
): number {
  const factor = WEIGHT_VOLUME_TO_GRAMS[item.unit]
  if (factor) {
    return Math.max(0, item.quantity - gramsConsumed / factor)
  }
  if (unitCountConsumed != null) {
    return Math.max(0, item.quantity - unitCountConsumed)
  }
  // Unité au compteur sans info précise : approximation 1 unité ≈ 100 g
  return Math.max(0, item.quantity - gramsConsumed / 100)
}

function normalizeStockName(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

// Retrouve l'article de stock correspondant à un aliment (ingrédient de recette, aliment
// scanné...). Priorité à l'identité exacte (id ou foodProductId), sinon au nom — en
// choisissant, parmi les homonymes, celui dont la DLC est la plus proche (FEFO).
export function findMatchingStockItem(
  stockItems: StockItem[],
  food: { id: string; name: string },
): StockItem | undefined {
  const byId = stockItems.find((s) => s.id === food.id || s.foodProductId === food.id)
  if (byId) return byId

  const targetName = normalizeStockName(food.name)
  const nameMatches = stockItems.filter((s) => normalizeStockName(s.name) === targetName)
  if (nameMatches.length === 0) return undefined
  if (nameMatches.length === 1) return nameMatches[0]

  return [...nameMatches].sort((a, b) => {
    const da = getDaysUntilExpiry(a)
    const db = getDaysUntilExpiry(b)
    if (da === null && db === null) return 0
    if (da === null) return 1
    if (db === null) return -1
    return da - db
  })[0]
}

// Enregistré sur un repas planifié lors d'une déduction de stock, pour pouvoir la
// restaurer si le repas est ensuite supprimé (ex. ajout par erreur).
export interface StockDeduction {
  stockItemId: string
  quantityDeducted: number
  itemSnapshot: Omit<StockItem, 'id' | 'addedAt' | 'quantity'>
}

export function buildStockDeduction(item: StockItem, quantityDeducted: number): StockDeduction {
  const { id: _id, addedAt: _addedAt, quantity: _quantity, ...itemSnapshot } = item
  return { stockItemId: item.id, quantityDeducted, itemSnapshot }
}

export type StockRestoration =
  | { action: 'update'; item: StockItem }
  | { action: 'create'; item: Omit<StockItem, 'id' | 'addedAt'> }

// Détermine comment annuler une déduction de stock : si l'article existe toujours,
// on lui rend la quantité ; s'il a été entièrement consommé (donc supprimé), on le
// recrée à partir de l'instantané pris au moment de la déduction.
export function computeStockRestoration(
  deduction: StockDeduction,
  currentStockItems: StockItem[],
): StockRestoration {
  const current = currentStockItems.find((s) => s.id === deduction.stockItemId)
  if (current) {
    return {
      action: 'update',
      item: { ...current, quantity: current.quantity + deduction.quantityDeducted },
    }
  }
  return {
    action: 'create',
    item: { ...deduction.itemSnapshot, quantity: deduction.quantityDeducted },
  }
}
