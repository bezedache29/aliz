import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { CustomFoodResponseDTO } from '@/src/apis/backendApi/dto/customFoods/customFood.dto'
import {
  customFoodDTOtoFoodProduct,
  foodProductToCreateCustomFoodDTO,
} from '@/src/apis/backendApi/mappers/customFoods/customFood.mapper'
import type { FoodProduct } from '@/src/models/food/food.model'

type NewCustomFood = {
  name: string
  brand?: string
  barcode?: string
  per100g: { kcal: number; proteines: number; glucides: number; lipides: number }
}

async function fetchCreateCustomFood(food: NewCustomFood): Promise<FoodProduct> {
  const { data } = await backendClient.post<CustomFoodResponseDTO>(
    '/api/custom-foods',
    foodProductToCreateCustomFoodDTO(food),
  )
  return customFoodDTOtoFoodProduct(data.data)
}

export function useCreateCustomFood() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchCreateCustomFood,
    onSuccess: (created) => {
      queryClient.setQueryData<FoodProduct[]>(['custom-foods'], (prev) => [
        created,
        ...(prev ?? []),
      ])
    },
  })
}
