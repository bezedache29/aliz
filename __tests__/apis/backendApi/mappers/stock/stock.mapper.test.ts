import type { StockItemDTO } from '@/src/apis/backendApi/dto/stock/stock.dto'
import {
  stockItemDTOtoStockItem,
  stockItemToCreateDTO,
  stockItemToUpdateDTO,
} from '@/src/apis/backendApi/mappers/stock/stock.mapper'
import type { StockItem } from '@/src/models/stock/stock-item.model'

const stockDTO: StockItemDTO = {
  id: 's-1',
  foodName: 'Riz basmati',
  foodId: 'ciqual-42',
  foodSource: 'ciqual',
  foodBrand: 'Uncle Ben',
  foodBarcode: '3456789012345',
  per100gKcal: 350,
  per100gProteines: 7,
  per100gGlucides: 77,
  per100gLipides: 0.5,
  quantityG: 500,
  expiryDate: '2026-12-31',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const stockItem: Omit<StockItem, 'id' | 'addedAt'> = {
  name: 'Riz basmati',
  brand: 'Uncle Ben',
  quantity: 500,
  unit: 'g',
  category: 'Sec',
  expiryDate: '2026-12-31',
  per100g: { kcal: 350, proteines: 7, glucides: 77, lipides: 0.5 },
  source: 'ciqual',
  foodProductId: 'ciqual-42',
}

describe('stockItemDTOtoStockItem', () => {
  it('mappe tous les champs correctement', () => {
    const item = stockItemDTOtoStockItem(stockDTO)
    expect(item.id).toBe('s-1')
    expect(item.name).toBe('Riz basmati')
    expect(item.brand).toBe('Uncle Ben')
    expect(item.quantity).toBe(500)
    expect(item.expiryDate).toBe('2026-12-31')
    expect(item.foodProductId).toBe('ciqual-42')
    expect(item.source).toBe('ciqual')
    expect(item.addedAt).toBe('2026-01-01T00:00:00Z')
  })

  it("force unit à 'g' quel que soit le DTO", () => {
    const item = stockItemDTOtoStockItem(stockDTO)
    expect(item.unit).toBe('g')
  })

  it("force category à 'Sec' quel que soit le DTO", () => {
    const item = stockItemDTOtoStockItem(stockDTO)
    expect(item.category).toBe('Sec')
  })

  it('mappe per100g quand les valeurs sont présentes', () => {
    const item = stockItemDTOtoStockItem(stockDTO)
    expect(item.per100g).toEqual({ kcal: 350, proteines: 7, glucides: 77, lipides: 0.5 })
  })

  it('met per100g à undefined quand per100gKcal est null', () => {
    const item = stockItemDTOtoStockItem({ ...stockDTO, per100gKcal: null })
    expect(item.per100g).toBeUndefined()
  })

  it('met les valeurs null de per100g à 0', () => {
    const item = stockItemDTOtoStockItem({
      ...stockDTO,
      per100gProteines: null,
      per100gGlucides: null,
      per100gLipides: null,
    })
    expect(item.per100g).toEqual({ kcal: 350, proteines: 0, glucides: 0, lipides: 0 })
  })

  it('met brand à undefined quand foodBrand est null', () => {
    const item = stockItemDTOtoStockItem({ ...stockDTO, foodBrand: null })
    expect(item.brand).toBeUndefined()
  })

  it('met expiryDate à undefined quand null', () => {
    const item = stockItemDTOtoStockItem({ ...stockDTO, expiryDate: null })
    expect(item.expiryDate).toBeUndefined()
  })

  it('met foodProductId à undefined quand foodId est null', () => {
    const item = stockItemDTOtoStockItem({ ...stockDTO, foodId: null })
    expect(item.foodProductId).toBeUndefined()
  })

  it("source par défaut à 'manual' quand foodSource est null", () => {
    const item = stockItemDTOtoStockItem({ ...stockDTO, foodSource: null })
    expect(item.source).toBe('manual')
  })
})

describe('stockItemToCreateDTO', () => {
  it('mappe tous les champs correctement', () => {
    const dto = stockItemToCreateDTO(stockItem)
    expect(dto.foodName).toBe('Riz basmati')
    expect(dto.foodBrand).toBe('Uncle Ben')
    expect(dto.quantityG).toBe(500)
    expect(dto.expiryDate).toBe('2026-12-31')
    expect(dto.foodId).toBe('ciqual-42')
    expect(dto.foodSource).toBe('ciqual')
    expect(dto.per100gKcal).toBe(350)
    expect(dto.per100gProteines).toBe(7)
    expect(dto.per100gGlucides).toBe(77)
    expect(dto.per100gLipides).toBe(0.5)
  })

  it('met foodId à null quand foodProductId est absent', () => {
    const dto = stockItemToCreateDTO({ ...stockItem, foodProductId: undefined })
    expect(dto.foodId).toBeNull()
  })

  it('met foodBrand à null quand brand est absent', () => {
    const dto = stockItemToCreateDTO({ ...stockItem, brand: undefined })
    expect(dto.foodBrand).toBeNull()
  })

  it('met per100g à null quand per100g est absent', () => {
    const dto = stockItemToCreateDTO({ ...stockItem, per100g: undefined })
    expect(dto.per100gKcal).toBeNull()
    expect(dto.per100gProteines).toBeNull()
    expect(dto.per100gGlucides).toBeNull()
    expect(dto.per100gLipides).toBeNull()
  })

  it('met expiryDate à null quand absent', () => {
    const dto = stockItemToCreateDTO({ ...stockItem, expiryDate: undefined })
    expect(dto.expiryDate).toBeNull()
  })
})

describe('stockItemToUpdateDTO', () => {
  it('retourne un objet vide si aucun champ fourni', () => {
    const dto = stockItemToUpdateDTO({})
    expect(dto).toEqual({})
  })

  it('inclut uniquement les champs définis', () => {
    const dto = stockItemToUpdateDTO({ name: 'Lentilles', quantity: 300 })
    expect(dto.foodName).toBe('Lentilles')
    expect(dto.quantityG).toBe(300)
    expect(dto.foodBrand).toBeUndefined()
    expect(dto.expiryDate).toBeUndefined()
  })

  it('renomme name → foodName', () => {
    const dto = stockItemToUpdateDTO({ name: 'Pâtes' })
    expect(dto.foodName).toBe('Pâtes')
    expect((dto as any).name).toBeUndefined()
  })

  it('renomme quantity → quantityG', () => {
    const dto = stockItemToUpdateDTO({ quantity: 250 })
    expect(dto.quantityG).toBe(250)
  })

  it('inclut per100g si défini', () => {
    const dto = stockItemToUpdateDTO({
      per100g: { kcal: 200, proteines: 5, glucides: 40, lipides: 1 },
    })
    expect(dto.per100gKcal).toBe(200)
    expect(dto.per100gProteines).toBe(5)
    expect(dto.per100gGlucides).toBe(40)
    expect(dto.per100gLipides).toBe(1)
  })

  it('renomme foodProductId → foodId', () => {
    const dto = stockItemToUpdateDTO({ foodProductId: 'off-123' })
    expect(dto.foodId).toBe('off-123')
  })

  it('renomme source → foodSource', () => {
    const dto = stockItemToUpdateDTO({ source: 'openfoodfacts' })
    expect(dto.foodSource).toBe('openfoodfacts')
  })

  it('ignore brand quand sa valeur est undefined (champ non modifié)', () => {
    const dto = stockItemToUpdateDTO({ brand: undefined })
    expect(dto.foodBrand).toBeUndefined()
  })
})
