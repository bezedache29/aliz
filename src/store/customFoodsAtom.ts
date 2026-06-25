import { FoodProduct } from '@/src/models/food/food.model'
import { atomWithMMKV } from './atomWithMMKV'

// TODO(backend): remplacer par useQuery/useMutation vers GET|POST /foods/custom
// Lire : GET /foods/custom → FoodProduct[]
// Créer : POST /foods/custom { name, brand?, per100g } → FoodProduct
// Supprimer : DELETE /foods/custom/:id
export const customFoodsAtom = atomWithMMKV<FoodProduct[]>('custom_foods', [])

export function addCustomFood(prev: FoodProduct[], food: FoodProduct): FoodProduct[] {
  const without = prev.filter((f) => f.id !== food.id)
  return [food, ...without]
}

export function searchCustomFoods(foods: FoodProduct[], query: string): FoodProduct[] {
  if (!query.trim()) return foods
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return foods.filter((f) => {
    const name = f.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const brand = f.brand?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') ?? ''
    return name.includes(q) || brand.includes(q)
  })
}
