import type { CustomFoodDTO } from '@/src/apis/backendApi/dto/customFoods/customFood.dto'
import {
  customFoodDTOtoFoodProduct,
  foodProductToCreateCustomFoodDTO,
} from '@/src/apis/backendApi/mappers/customFoods/customFood.mapper'

const customFoodDTO: CustomFoodDTO = {
  id: 'cf-1',
  name: 'Gâteau marbré maison',
  brand: 'Fait maison',
  barcode: '3123456789012',
  per100gKcal: 350,
  per100gProteines: 5,
  per100gGlucides: 45,
  per100gLipides: 15,
  per100gFibres: 2,
  per100gSel: 0.5,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('customFoodDTOtoFoodProduct', () => {
  it('mappe tous les champs correctement', () => {
    const food = customFoodDTOtoFoodProduct(customFoodDTO)
    expect(food.id).toBe('cf-1')
    expect(food.name).toBe('Gâteau marbré maison')
    expect(food.brand).toBe('Fait maison')
    expect(food.barcode).toBe('3123456789012')
    expect(food.source).toBe('manual')
    expect(food.per100g).toEqual({
      kcal: 350,
      proteines: 5,
      glucides: 45,
      lipides: 15,
      fibres: 2,
      sel: 0.5,
    })
  })

  it('met brand à undefined quand null', () => {
    const food = customFoodDTOtoFoodProduct({ ...customFoodDTO, brand: null })
    expect(food.brand).toBeUndefined()
  })

  it('met barcode à undefined quand null', () => {
    const food = customFoodDTOtoFoodProduct({ ...customFoodDTO, barcode: null })
    expect(food.barcode).toBeUndefined()
  })

  it('met fibres et sel à undefined quand null', () => {
    const food = customFoodDTOtoFoodProduct({
      ...customFoodDTO,
      per100gFibres: null,
      per100gSel: null,
    })
    expect(food.per100g.fibres).toBeUndefined()
    expect(food.per100g.sel).toBeUndefined()
  })

  it("source est toujours 'manual'", () => {
    expect(customFoodDTOtoFoodProduct(customFoodDTO).source).toBe('manual')
  })
})

describe('foodProductToCreateCustomFoodDTO', () => {
  const input = {
    name: 'Compote maison',
    brand: 'Fait maison',
    barcode: '3987654321098',
    per100g: { kcal: 50, proteines: 0, glucides: 12, lipides: 0 },
  }

  it('mappe tous les champs correctement', () => {
    const dto = foodProductToCreateCustomFoodDTO(input)
    expect(dto.name).toBe('Compote maison')
    expect(dto.brand).toBe('Fait maison')
    expect(dto.barcode).toBe('3987654321098')
    expect(dto.per100gKcal).toBe(50)
    expect(dto.per100gProteines).toBe(0)
    expect(dto.per100gGlucides).toBe(12)
    expect(dto.per100gLipides).toBe(0)
  })

  it('met brand à null quand absent', () => {
    const dto = foodProductToCreateCustomFoodDTO({ ...input, brand: undefined })
    expect(dto.brand).toBeNull()
  })

  it('met barcode à null quand absent', () => {
    const dto = foodProductToCreateCustomFoodDTO({ ...input, barcode: undefined })
    expect(dto.barcode).toBeNull()
  })
})
