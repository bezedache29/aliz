export interface OpenFoodFactsNutrimentsDTO {
  'energy-kcal_100g'?: number
  proteins_100g?: number
  carbohydrates_100g?: number
  fat_100g?: number
  fiber_100g?: number
  salt_100g?: number
}

export interface OpenFoodFactsProductDTO {
  code: string
  product_name?: string
  brands?: string
  nutriments?: OpenFoodFactsNutrimentsDTO
  image_thumb_url?: string
}

export interface OpenFoodFactsSearchResponseDTO {
  products: OpenFoodFactsProductDTO[]
  count: number
}
