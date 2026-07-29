import type {
  CreateCustomFoodDTO,
  CustomFoodDTO,
} from '@/src/apis/backendApi/dto/customFoods/customFood.dto'
import type { FoodProduct } from '@/src/models/food/food.model'

export function customFoodDTOtoFoodProduct(dto: CustomFoodDTO): FoodProduct {
  return {
    id: dto.id,
    barcode: dto.barcode ?? undefined,
    name: dto.name,
    brand: dto.brand ?? undefined,
    source: 'manual',
    per100g: {
      kcal: dto.per100gKcal,
      proteines: dto.per100gProteines,
      glucides: dto.per100gGlucides,
      lipides: dto.per100gLipides,
      fibres: dto.per100gFibres ?? undefined,
      sel: dto.per100gSel ?? undefined,
    },
  }
}

export function foodProductToCreateCustomFoodDTO(food: {
  name: string
  brand?: string
  barcode?: string
  per100g: { kcal: number; proteines: number; glucides: number; lipides: number }
}): CreateCustomFoodDTO {
  return {
    name: food.name,
    brand: food.brand || null,
    barcode: food.barcode || null,
    per100gKcal: food.per100g.kcal,
    per100gProteines: food.per100g.proteines,
    per100gGlucides: food.per100g.glucides,
    per100gLipides: food.per100g.lipides,
  }
}
