import { FoodProduct } from '@/src/models/food/food.model'
import { atomWithMMKV } from './atomWithMMKV'

const MAX_RECENT = 50

export const recentFoodsAtom = atomWithMMKV<FoodProduct[]>('recent_foods', [])

export function addToRecent(prev: FoodProduct[], food: FoodProduct): FoodProduct[] {
  const without = prev.filter((f) => f.id !== food.id)
  return [food, ...without].slice(0, MAX_RECENT)
}
