import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'

import { offClient } from '@/src/apis/openFoodFactsApi/client'
import { OpenFoodFactsProductDTO } from '@/src/apis/openFoodFactsApi/dto/food/food.dto'
import { openFoodFactsDTOtoFoodProduct } from '@/src/apis/openFoodFactsApi/mappers/food/food.mapper'
import { FoodProduct } from '@/src/models/food/food.model'

interface OFFProductResponseDTO {
  status: number
  product?: OpenFoodFactsProductDTO
}

async function fetchFoodByBarcode(barcode: string): Promise<FoodProduct | null> {
  try {
    const { data } = await offClient.get<OFFProductResponseDTO>(`/api/v2/product/${barcode}.json`, {
      params: { fields: 'code,product_name,brands,nutriments,image_thumb_url' },
    })
    if (data.status !== 1 || !data.product?.product_name?.trim()) return null
    if ((data.product.nutriments?.['energy-kcal_100g'] ?? 0) <= 0) return null
    return openFoodFactsDTOtoFoodProduct(data.product)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export function useFoodByBarcode(barcode: string | null) {
  return useQuery({
    queryKey: ['openfoodfacts', 'barcode', barcode],
    queryFn: () => fetchFoodByBarcode(barcode!),
    enabled: !!barcode,
    staleTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (!isAxiosError(error)) return false
      const status = error.response?.status
      if (status === 503 || status === undefined) return failureCount < 3
      return false
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  })
}
