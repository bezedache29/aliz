import { FoodProduct } from '@/src/models/food/food.model'

export function searchCustomFoods(foods: FoodProduct[], query: string): FoodProduct[] {
  if (!query.trim()) return foods
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return foods.filter((f) => {
    const name = f.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const brand = f.brand?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') ?? ''
    return name.includes(q) || brand.includes(q)
  })
}
