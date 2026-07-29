export interface CustomFoodDTO {
  id: string
  name: string
  brand: string | null
  barcode: string | null
  per100gKcal: number
  per100gProteines: number
  per100gGlucides: number
  per100gLipides: number
  per100gFibres: number | null
  per100gSel: number | null
  createdAt: string
  updatedAt: string
}

export interface CustomFoodsListResponseDTO {
  data: CustomFoodDTO[]
}

export interface CustomFoodResponseDTO {
  data: CustomFoodDTO
}

export interface CreateCustomFoodDTO {
  name: string
  brand?: string | null
  barcode?: string | null
  per100gKcal: number
  per100gProteines: number
  per100gGlucides: number
  per100gLipides: number
  per100gFibres?: number | null
  per100gSel?: number | null
}
