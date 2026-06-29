import type { FoodPreferenceDTO } from '@/src/apis/backendApi/dto/preference/preference.dto'
import {
  createPreferenceToDTO,
  foodPreferenceDTOtoFoodPreference,
  foodPreferencesToModel,
} from '@/src/apis/backendApi/mappers/preference/preference.mapper'

const likedDTO: FoodPreferenceDTO = {
  id: 'p-1',
  foodName: 'Poulet',
  type: 'liked',
}

const dislikedDTO: FoodPreferenceDTO = {
  id: 'p-2',
  foodName: 'Foie',
  type: 'disliked',
}

describe('foodPreferenceDTOtoFoodPreference', () => {
  it('maps all fields correctly', () => {
    const result = foodPreferenceDTOtoFoodPreference(likedDTO)
    expect(result.id).toBe('p-1')
    expect(result.foodName).toBe('Poulet')
    expect(result.type).toBe('liked')
  })

  it("maps type 'liked' correctly", () => {
    expect(foodPreferenceDTOtoFoodPreference(likedDTO).type).toBe('liked')
  })

  it("maps type 'disliked' correctly", () => {
    expect(foodPreferenceDTOtoFoodPreference(dislikedDTO).type).toBe('disliked')
  })
})

describe('foodPreferencesToModel', () => {
  it('maps liked and disliked arrays correctly', () => {
    const result = foodPreferencesToModel({ liked: [likedDTO], disliked: [dislikedDTO] })
    expect(result.liked).toHaveLength(1)
    expect(result.liked[0].foodName).toBe('Poulet')
    expect(result.disliked).toHaveLength(1)
    expect(result.disliked[0].foodName).toBe('Foie')
  })

  it('handles empty arrays', () => {
    const result = foodPreferencesToModel({ liked: [], disliked: [] })
    expect(result.liked).toEqual([])
    expect(result.disliked).toEqual([])
  })
})

describe('createPreferenceToDTO', () => {
  it("maps foodName and type to DTO fields for 'liked'", () => {
    const dto = createPreferenceToDTO('Poulet', 'liked')
    expect(dto.foodName).toBe('Poulet')
    expect(dto.type).toBe('liked')
  })

  it("maps foodName and type to DTO fields for 'disliked'", () => {
    const dto = createPreferenceToDTO('Foie', 'disliked')
    expect(dto.foodName).toBe('Foie')
    expect(dto.type).toBe('disliked')
  })
})
