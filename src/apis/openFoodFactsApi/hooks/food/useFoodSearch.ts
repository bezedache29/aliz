import { useQuery } from '@tanstack/react-query'

import { offClient } from '@/src/apis/openFoodFactsApi/client'
import { OpenFoodFactsSearchResponseDTO } from '@/src/apis/openFoodFactsApi/dto/food/food.dto'
import { openFoodFactsDTOtoFoodProduct } from '@/src/apis/openFoodFactsApi/mappers/food/food.mapper'
import { FoodProduct } from '@/src/models/food/food.model'

async function fetchFoodSearch(query: string): Promise<FoodProduct[]> {
  const { data } = await offClient.get<OpenFoodFactsSearchResponseDTO>('/cgi/search.pl', {
    params: {
      search_terms: query,
      search_simple: 1,
      action: 'process',
      json: 1,
      page_size: 20,
      fields: 'code,product_name,brands,nutriments,image_thumb_url',
      lc: 'fr',
      cc: 'fr',
    },
  })

  return (data.products ?? [])
    .filter((p) => p.product_name?.trim() && (p.nutriments?.['energy-kcal_100g'] ?? 0) > 0)
    .map(openFoodFactsDTOtoFoodProduct)
}

export function useFoodSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ['openfoodfacts', 'food-search', query],
    queryFn: () => fetchFoodSearch(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
