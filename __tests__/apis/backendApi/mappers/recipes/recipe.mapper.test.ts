import type { RecipeDTO, RecipeIngredientDTO } from '@/src/apis/backendApi/dto/recipes/recipe.dto'
import {
  recipeDTOtoRecipe,
  recipeToCreateDTO,
  recipeToUpdateDTO,
} from '@/src/apis/backendApi/mappers/recipes/recipe.mapper'
import type { Recipe, RecipeIngredient } from '@/src/models/recipe/recipe.model'

const ingredientDTO: RecipeIngredientDTO = {
  foodId: 'ciqual-1',
  foodName: 'Blanc de poulet cuit',
  foodSource: 'ciqual',
  foodBrand: undefined,
  foodBarcode: undefined,
  per100gKcal: 165,
  per100gProteines: 31,
  per100gGlucides: 0,
  per100gLipides: 3.6,
  per100gFibres: undefined,
  per100gSel: undefined,
  quantityG: 200,
}

const recipeDTO: RecipeDTO = {
  id: 'recipe-1',
  name: 'Poulet rôti aux légumes',
  category: 'Plat principal',
  ingredients: [ingredientDTO],
  steps: ['Préchauffer le four', 'Enfourner 40 min'],
  isFavorite: true,
  prepTime: 15,
  cookTime: 40,
  servings: 4,
  seasons: ['Automne', 'Hiver'],
  cookingMethod: 'Four',
}

const ingredient: RecipeIngredient = {
  food: {
    id: 'ciqual-1',
    name: 'Blanc de poulet cuit',
    source: 'ciqual',
    per100g: { kcal: 165, proteines: 31, glucides: 0, lipides: 3.6 },
  },
  quantityG: 200,
}

const recipe: Recipe = {
  id: 'recipe-1',
  name: 'Poulet rôti aux légumes',
  category: 'Plat principal',
  ingredients: [ingredient],
  steps: ['Préchauffer le four', 'Enfourner 40 min'],
  isFavorite: true,
  prepTime: 15,
  cookTime: 40,
  servings: 4,
  seasons: ['Automne', 'Hiver'],
  cookingMethod: 'Four',
}

// ─── recipeDTOtoRecipe ───────────────────────────────────────────────────────

describe('recipeDTOtoRecipe', () => {
  it('maps all required fields', () => {
    const result = recipeDTOtoRecipe(recipeDTO)
    expect(result.id).toBe('recipe-1')
    expect(result.name).toBe('Poulet rôti aux légumes')
    expect(result.category).toBe('Plat principal')
    expect(result.isFavorite).toBe(true)
  })

  it('maps optional fields when present', () => {
    const result = recipeDTOtoRecipe(recipeDTO)
    expect(result.prepTime).toBe(15)
    expect(result.cookTime).toBe(40)
    expect(result.servings).toBe(4)
    expect(result.seasons).toEqual(['Automne', 'Hiver'])
    expect(result.cookingMethod).toBe('Four')
  })

  it('keeps optional fields undefined when absent', () => {
    const dto: RecipeDTO = {
      id: 'x',
      name: 'Test',
      category: 'Encas',
      ingredients: [],
      steps: [],
      isFavorite: false,
    }
    const result = recipeDTOtoRecipe(dto)
    expect(result.prepTime).toBeUndefined()
    expect(result.cookTime).toBeUndefined()
    expect(result.servings).toBeUndefined()
    expect(result.seasons).toBeUndefined()
    expect(result.cookingMethod).toBeUndefined()
  })

  it('maps steps array', () => {
    const result = recipeDTOtoRecipe(recipeDTO)
    expect(result.steps).toEqual(['Préchauffer le four', 'Enfourner 40 min'])
  })

  it('maps ingredient food fields', () => {
    const result = recipeDTOtoRecipe(recipeDTO)
    const ing = result.ingredients[0]
    expect(ing.food.id).toBe('ciqual-1')
    expect(ing.food.name).toBe('Blanc de poulet cuit')
    expect(ing.food.source).toBe('ciqual')
    expect(ing.quantityG).toBe(200)
  })

  it('maps ingredient per100g nutrition', () => {
    const result = recipeDTOtoRecipe(recipeDTO)
    const { per100g } = result.ingredients[0].food
    expect(per100g.kcal).toBe(165)
    expect(per100g.proteines).toBe(31)
    expect(per100g.glucides).toBe(0)
    expect(per100g.lipides).toBe(3.6)
  })

  it('maps optional ingredient fields when present', () => {
    const dtoWithExtras: RecipeIngredientDTO = {
      ...ingredientDTO,
      foodBrand: 'LeDélic',
      foodBarcode: '1234567890123',
      per100gFibres: 2.1,
      per100gSel: 0.5,
    }
    const result = recipeDTOtoRecipe({ ...recipeDTO, ingredients: [dtoWithExtras] })
    const { food } = result.ingredients[0]
    expect(food.brand).toBe('LeDélic')
    expect(food.barcode).toBe('1234567890123')
    expect(food.per100g.fibres).toBe(2.1)
    expect(food.per100g.sel).toBe(0.5)
  })

  it('maps an empty ingredient list', () => {
    const result = recipeDTOtoRecipe({ ...recipeDTO, ingredients: [] })
    expect(result.ingredients).toHaveLength(0)
  })

  it('keeps steps undefined when absent in DTO', () => {
    const dto: RecipeDTO = {
      id: 'x',
      name: 'Test',
      category: 'Encas',
      ingredients: [],
      isFavorite: false,
    }
    const result = recipeDTOtoRecipe(dto)
    expect(result.steps).toBeUndefined()
  })
})

// ─── recipeToCreateDTO ───────────────────────────────────────────────────────

describe('recipeToCreateDTO', () => {
  it('maps all required fields', () => {
    const { id: _id, isFavorite: _fav, ...recipeWithoutId } = recipe
    const dto = recipeToCreateDTO(recipeWithoutId)
    expect(dto.name).toBe('Poulet rôti aux légumes')
    expect(dto.category).toBe('Plat principal')
    expect(dto.steps).toEqual(['Préchauffer le four', 'Enfourner 40 min'])
  })

  it('maps optional fields when present', () => {
    const { id: _id, isFavorite: _fav, ...recipeWithoutId } = recipe
    const dto = recipeToCreateDTO(recipeWithoutId)
    expect(dto.prepTime).toBe(15)
    expect(dto.cookTime).toBe(40)
    expect(dto.servings).toBe(4)
    expect(dto.seasons).toEqual(['Automne', 'Hiver'])
    expect(dto.cookingMethod).toBe('Four')
  })

  it('maps ingredient to DTO format', () => {
    const { id: _id, isFavorite: _fav, ...recipeWithoutId } = recipe
    const dto = recipeToCreateDTO(recipeWithoutId)
    const ing = dto.ingredients[0]
    expect(ing.foodId).toBe('ciqual-1')
    expect(ing.foodName).toBe('Blanc de poulet cuit')
    expect(ing.foodSource).toBe('ciqual')
    expect(ing.per100gKcal).toBe(165)
    expect(ing.per100gProteines).toBe(31)
    expect(ing.quantityG).toBe(200)
  })

  it('defaults fibres and sel to 0 when undefined in ingredient', () => {
    const { id: _id, isFavorite: _fav, ...recipeWithoutId } = recipe
    const dto = recipeToCreateDTO(recipeWithoutId)
    const ing = dto.ingredients[0]
    expect(ing.per100gFibres).toBe(0)
    expect(ing.per100gSel).toBe(0)
  })

  it('does not include id or isFavorite', () => {
    const { id: _id, isFavorite: _fav, ...recipeWithoutId } = recipe
    const dto = recipeToCreateDTO(recipeWithoutId)
    expect((dto as Record<string, unknown>).id).toBeUndefined()
    expect((dto as Record<string, unknown>).isFavorite).toBeUndefined()
  })
})

// ─── recipeToUpdateDTO ───────────────────────────────────────────────────────

describe('recipeToUpdateDTO', () => {
  it('maps a name-only patch', () => {
    const dto = recipeToUpdateDTO({ name: 'Nouveau nom' })
    expect(dto.name).toBe('Nouveau nom')
  })

  it('maps isFavorite patch', () => {
    const dto = recipeToUpdateDTO({ isFavorite: false })
    expect(dto.isFavorite).toBe(false)
  })

  it('maps a full recipe patch', () => {
    const dto = recipeToUpdateDTO(recipe)
    expect(dto.name).toBe('Poulet rôti aux légumes')
    expect(dto.isFavorite).toBe(true)
    expect(dto.ingredients).toHaveLength(1)
  })

  it('does not include id', () => {
    const dto = recipeToUpdateDTO(recipe)
    expect((dto as Record<string, unknown>).id).toBeUndefined()
  })
})
