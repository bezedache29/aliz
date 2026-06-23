import { CiqualFoodDTO } from '@/src/apis/ciqualApi/dto/food/food.dto'
import { FoodProduct } from '@/src/models/food/food.model'

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function ciqualDTOtoFoodProduct(dto: CiqualFoodDTO): FoodProduct {
  return {
    id: `ciqual-${dto.id}`,
    name: dto.nom,
    source: 'ciqual',
    per100g: {
      kcal: Math.round(dto.kcal),
      proteines: round1(dto.proteines),
      glucides: round1(dto.glucides),
      lipides: round1(dto.lipides),
      fibres: dto.fibres != null ? round1(dto.fibres) : undefined,
      sel: dto.sel != null ? round1(dto.sel) : undefined,
    },
  }
}
