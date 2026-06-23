import { OpenFoodFactsProductDTO } from '@/src/apis/openFoodFactsApi/dto/food/food.dto'
import { FoodProduct } from '@/src/models/food/food.model'

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function openFoodFactsDTOtoFoodProduct(dto: OpenFoodFactsProductDTO): FoodProduct {
  const n = dto.nutriments ?? {}
  return {
    id: dto.code,
    barcode: dto.code,
    name: dto.product_name?.trim() ?? 'Aliment inconnu',
    brand: dto.brands?.split(',')[0]?.trim(),
    source: 'openfoodfacts',
    per100g: {
      kcal: Math.round(n['energy-kcal_100g'] ?? 0),
      proteines: round1(n.proteins_100g ?? 0),
      glucides: round1(n.carbohydrates_100g ?? 0),
      lipides: round1(n.fat_100g ?? 0),
      fibres: n.fiber_100g != null ? round1(n.fiber_100g) : undefined,
      sel: n.salt_100g != null ? round1(n.salt_100g) : undefined,
    },
    imageThumbnail: dto.image_thumb_url,
  }
}
