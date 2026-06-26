import type {
  CreateStockDTO,
  StockItemDTO,
  UpdateStockDTO,
} from '@/src/apis/backendApi/dto/stock/stock.dto'
import type { StockItem } from '@/src/models/stock/stock-item.model'

export function stockItemDTOtoStockItem(dto: StockItemDTO): StockItem {
  return {
    id: dto.id,
    name: dto.foodName,
    brand: dto.foodBrand ?? undefined,
    quantity: dto.quantityG,
    unit: 'g',
    category: 'Sec',
    expiryDate: dto.expiryDate ?? undefined,
    per100g:
      dto.per100gKcal != null
        ? {
            kcal: dto.per100gKcal,
            proteines: dto.per100gProteines ?? 0,
            glucides: dto.per100gGlucides ?? 0,
            lipides: dto.per100gLipides ?? 0,
          }
        : undefined,
    source: (dto.foodSource as StockItem['source']) ?? 'manual',
    foodProductId: dto.foodId ?? undefined,
    addedAt: dto.createdAt,
  }
}

export function stockItemToCreateDTO(item: Omit<StockItem, 'id' | 'addedAt'>): CreateStockDTO {
  return {
    foodName: item.name,
    foodId: item.foodProductId ?? null,
    foodSource: item.source,
    foodBrand: item.brand ?? null,
    per100gKcal: item.per100g?.kcal ?? null,
    per100gProteines: item.per100g?.proteines ?? null,
    per100gGlucides: item.per100g?.glucides ?? null,
    per100gLipides: item.per100g?.lipides ?? null,
    quantityG: item.quantity,
    expiryDate: item.expiryDate ?? null,
  }
}

export function stockItemToUpdateDTO(item: Partial<StockItem>): UpdateStockDTO {
  const dto: UpdateStockDTO = {}
  if (item.name !== undefined) dto.foodName = item.name
  if (item.foodProductId !== undefined) dto.foodId = item.foodProductId ?? null
  if (item.source !== undefined) dto.foodSource = item.source
  if (item.brand !== undefined) dto.foodBrand = item.brand ?? null
  if (item.per100g !== undefined) {
    dto.per100gKcal = item.per100g?.kcal ?? null
    dto.per100gProteines = item.per100g?.proteines ?? null
    dto.per100gGlucides = item.per100g?.glucides ?? null
    dto.per100gLipides = item.per100g?.lipides ?? null
  }
  if (item.quantity !== undefined) dto.quantityG = item.quantity
  if (item.expiryDate !== undefined) dto.expiryDate = item.expiryDate ?? null
  return dto
}
