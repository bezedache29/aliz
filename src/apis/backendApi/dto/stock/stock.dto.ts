export interface StockItemDTO {
  id: string
  foodName: string
  foodId: string | null
  foodSource: string | null
  foodBrand: string | null
  foodBarcode: string | null
  per100gKcal: number | null
  per100gProteines: number | null
  per100gGlucides: number | null
  per100gLipides: number | null
  quantityG: number
  unit: string
  category: string
  state: string | null
  expiryDate: string | null
  createdAt: string
  updatedAt: string
}

export interface StockListResponseDTO {
  data: StockItemDTO[]
}

export interface StockItemResponseDTO {
  data: StockItemDTO
}

export interface CreateStockDTO {
  foodName: string
  foodId?: string | null
  foodSource?: string | null
  foodBrand?: string | null
  foodBarcode?: string | null
  per100gKcal?: number | null
  per100gProteines?: number | null
  per100gGlucides?: number | null
  per100gLipides?: number | null
  quantityG: number
  unit: string
  category: string
  state?: string | null
  expiryDate?: string | null
}

export type UpdateStockDTO = Partial<CreateStockDTO>
