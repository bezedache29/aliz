import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { CustomFoodsListResponseDTO } from '@/src/apis/backendApi/dto/customFoods/customFood.dto'
import { customFoodDTOtoFoodProduct } from '@/src/apis/backendApi/mappers/customFoods/customFood.mapper'
import type { FoodProduct } from '@/src/models/food/food.model'

async function fetchCustomFoods(): Promise<FoodProduct[]> {
  const { data } = await backendClient.get<CustomFoodsListResponseDTO>('/api/custom-foods')
  return data.data.map(customFoodDTOtoFoodProduct)
}

export function useCustomFoods() {
  return useQuery({
    queryKey: ['custom-foods'],
    queryFn: fetchCustomFoods,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
