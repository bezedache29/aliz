import { atom } from 'jotai'

import { FoodProduct } from '@/src/models/food/food.model'

export interface PendingIngredient {
  food: FoodProduct
  quantityG: number
}

export const pendingIngredientAtom = atom<PendingIngredient | null>(null)
