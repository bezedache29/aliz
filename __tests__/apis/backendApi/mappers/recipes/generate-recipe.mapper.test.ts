import type { GeneratedRecipeDTO } from '@/src/apis/backendApi/dto/recipes/generate-recipe.dto'
import { generatedRecipeDTOtoRecipe } from '@/src/apis/backendApi/mappers/recipes/generate-recipe.mapper'

const baseDTO: GeneratedRecipeDTO = {
  name: 'Poulet rôti aux légumes',
  description: 'Un plat savoureux et équilibré.',
  category: 'Plat principal',
  meal: 'Dîner',
  cookingMethod: 'Four',
  seasons: ['Automne', 'Hiver'],
  prepTime: 15,
  cookTime: 45,
  kcalEstimated: 520,
  proteinesEstimated: 42,
  glucidesEstimated: 18,
  lipidesEstimated: 28,
  steps: ['Préchauffer le four à 200°C', 'Enfourner 45 min'],
  ingredients: [
    {
      foodName: 'Poulet',
      quantityG: 300,
      per100gKcal: 165,
      per100gProteines: 31,
      per100gGlucides: 0,
      per100gLipides: 3.6,
      fromStock: true,
    },
  ],
}

describe('generatedRecipeDTOtoRecipe', () => {
  it('maps all required fields', () => {
    const result = generatedRecipeDTOtoRecipe(baseDTO)
    expect(result.name).toBe('Poulet rôti aux légumes')
    expect(result.category).toBe('Plat principal')
    expect(result.isFavorite).toBe(false)
    expect(result.isAiGenerated).toBe(true)
    expect(result.steps).toEqual(['Préchauffer le four à 200°C', 'Enfourner 45 min'])
  })

  it('maps optional fields when valid', () => {
    const result = generatedRecipeDTOtoRecipe(baseDTO)
    expect(result.meal).toBe('Dîner')
    expect(result.cookingMethod).toBe('Four')
    expect(result.seasons).toEqual(['Automne', 'Hiver'])
    expect(result.prepTime).toBe(15)
    expect(result.cookTime).toBe(45)
  })

  it('maps ingredient food fields with a synthesized manual source', () => {
    const result = generatedRecipeDTOtoRecipe(baseDTO)
    const ing = result.ingredients[0]
    expect(ing.food.name).toBe('Poulet')
    expect(ing.food.source).toBe('manual')
    expect(ing.food.id).toEqual(expect.any(String))
    expect(ing.quantityG).toBe(300)
  })

  it('maps ingredient per100g nutrition', () => {
    const result = generatedRecipeDTOtoRecipe(baseDTO)
    const { per100g } = result.ingredients[0].food
    expect(per100g.kcal).toBe(165)
    expect(per100g.proteines).toBe(31)
    expect(per100g.glucides).toBe(0)
    expect(per100g.lipides).toBe(3.6)
  })

  // Le backend exige des champs numériques (kcal, quantité...) sur chaque ingrédient, mais
  // LlmService ne valide que la présence globale de "ingredients", pas ses sous-champs — le
  // LLM peut donc omettre une valeur ponctuellement. Le mapper doit défaulter à 0 plutôt que
  // de laisser passer `undefined`, sous peine de faire échouer l'enregistrement de la recette.
  it('defaults missing per-ingredient numeric fields to 0 instead of undefined', () => {
    const dto: GeneratedRecipeDTO = {
      ...baseDTO,
      ingredients: [
        {
          foodName: 'Mystère',
          fromStock: false,
        } as GeneratedRecipeDTO['ingredients'][number],
      ],
    }
    const result = generatedRecipeDTOtoRecipe(dto)
    const { per100g } = result.ingredients[0].food
    expect(per100g.kcal).toBe(0)
    expect(per100g.proteines).toBe(0)
    expect(per100g.glucides).toBe(0)
    expect(per100g.lipides).toBe(0)
    expect(per100g.fibres).toBe(0)
    expect(per100g.sel).toBe(0)
    expect(result.ingredients[0].quantityG).toBe(0)
  })

  it('generates distinct ids for each ingredient', () => {
    const dto: GeneratedRecipeDTO = {
      ...baseDTO,
      ingredients: [baseDTO.ingredients[0], { ...baseDTO.ingredients[0], foodName: 'Carotte' }],
    }
    const result = generatedRecipeDTOtoRecipe(dto)
    expect(result.ingredients[0].food.id).not.toBe(result.ingredients[1].food.id)
  })

  // Le LLM n'est pas contraint côté backend : une catégorie hors de l'enum ne doit pas planter l'app
  it('falls back to "Plat principal" when category is not a known enum value', () => {
    const dto: GeneratedRecipeDTO = { ...baseDTO, category: 'Plat exotique inconnu' }
    const result = generatedRecipeDTOtoRecipe(dto)
    expect(result.category).toBe('Plat principal')
  })

  it('drops meal when it is not a known enum value', () => {
    const dto: GeneratedRecipeDTO = { ...baseDTO, meal: 'Goûter' }
    const result = generatedRecipeDTOtoRecipe(dto)
    expect(result.meal).toBeUndefined()
  })

  it('leaves meal undefined when absent from the DTO', () => {
    const { meal: _meal, ...rest } = baseDTO
    const result = generatedRecipeDTOtoRecipe(rest)
    expect(result.meal).toBeUndefined()
  })

  it('drops cookingMethod when it is not a known enum value', () => {
    const dto: GeneratedRecipeDTO = { ...baseDTO, cookingMethod: 'Micro-ondes' }
    const result = generatedRecipeDTOtoRecipe(dto)
    expect(result.cookingMethod).toBeUndefined()
  })

  it('filters out unknown seasons but keeps valid ones', () => {
    const dto: GeneratedRecipeDTO = { ...baseDTO, seasons: ['Automne', 'Mousson'] }
    const result = generatedRecipeDTOtoRecipe(dto)
    expect(result.seasons).toEqual(['Automne'])
  })

  it('defaults seasons to an empty array when absent from the DTO', () => {
    // Le backend exige "seasons" comme tableau requis (StoreRecipeRequest) — le mapper ne
    // doit jamais laisser passer `undefined`, sous peine de faire échouer l'enregistrement
    // de la recette générée quand le LLM omet ce champ optionnel.
    const { seasons: _seasons, ...rest } = baseDTO
    const result = generatedRecipeDTOtoRecipe(rest)
    expect(result.seasons).toEqual([])
  })

  it('maps an empty ingredient list', () => {
    const result = generatedRecipeDTOtoRecipe({ ...baseDTO, ingredients: [] })
    expect(result.ingredients).toHaveLength(0)
  })
})
