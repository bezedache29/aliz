export interface FoodProduct {
  id: string
  barcode?: string
  name: string
  brand?: string
  source: 'openfoodfacts' | 'ciqual' | 'aprifel' | 'manual'
  per100g: {
    kcal: number
    proteines: number
    glucides: number
    lipides: number
    fibres?: number
    sel?: number
  }
  imageThumbnail?: string
}
