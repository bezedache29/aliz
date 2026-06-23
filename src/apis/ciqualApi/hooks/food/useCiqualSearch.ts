import { useQuery } from '@tanstack/react-query'

import { searchCiqual } from '@/src/apis/ciqualApi/client'
import { ciqualDTOtoFoodProduct } from '@/src/apis/ciqualApi/mappers/food/food.mapper'
import { FoodProduct } from '@/src/models/food/food.model'

function fetchCiqualSearch(query: string): FoodProduct[] {
  return searchCiqual(query).map(ciqualDTOtoFoodProduct)
}

export function useCiqualSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ['ciqual', 'food-search', query],
    queryFn: () => fetchCiqualSearch(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: Infinity,
  })
}
