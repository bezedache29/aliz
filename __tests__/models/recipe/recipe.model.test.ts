import { computeRecipeNutrition } from '@/src/models/recipe/recipe.model'
import type { RecipeIngredient } from '@/src/models/recipe/recipe.model'

// Ingrédient helper avec valeurs nutritionnelles connues
const makeIngredient = (
  quantityG: number,
  per100g = { kcal: 100, proteines: 10, glucides: 20, lipides: 5 },
): RecipeIngredient => ({
  food: {
    id: 'test-food',
    name: 'Aliment test',
    source: 'manual',
    per100g,
  },
  quantityG,
})

describe('computeRecipeNutrition', () => {
  it('calcule les macros pour 1 portion (défaut)', () => {
    const ingredients = [makeIngredient(100)]
    const result = computeRecipeNutrition(ingredients)
    expect(result.kcal).toBe(100)
    expect(result.proteines).toBe(10)
    expect(result.glucides).toBe(20)
    expect(result.lipides).toBe(5)
  })

  it('divise par le nombre de portions', () => {
    const ingredients = [makeIngredient(200)]
    const result = computeRecipeNutrition(ingredients, 2)
    // 200g → kcal total 200, divisé par 2 = 100
    expect(result.kcal).toBe(100)
    expect(result.proteines).toBe(10)
    expect(result.glucides).toBe(20)
    expect(result.lipides).toBe(5)
  })

  it('additionne les macros de plusieurs ingrédients', () => {
    const ingredients = [
      makeIngredient(100, { kcal: 100, proteines: 10, glucides: 20, lipides: 5 }),
      makeIngredient(100, { kcal: 200, proteines: 20, glucides: 40, lipides: 10 }),
    ]
    const result = computeRecipeNutrition(ingredients, 1)
    expect(result.kcal).toBe(300)
    expect(result.proteines).toBe(30)
    expect(result.glucides).toBe(60)
    expect(result.lipides).toBe(15)
  })

  it('retourne 0 pour une liste vide', () => {
    const result = computeRecipeNutrition([], 1)
    expect(result.kcal).toBe(0)
    expect(result.proteines).toBe(0)
    expect(result.glucides).toBe(0)
    expect(result.lipides).toBe(0)
  })

  it('clamp servings à 1 minimum si 0 ou négatif', () => {
    const ingredients = [makeIngredient(100)]
    const result0 = computeRecipeNutrition(ingredients, 0)
    const resultNeg = computeRecipeNutrition(ingredients, -5)
    // servings 0 ou négatif → traité comme 1
    expect(result0.kcal).toBe(100)
    expect(resultNeg.kcal).toBe(100)
  })

  it('ignore les ingrédients sans per100g', () => {
    const validIngredient = makeIngredient(100)
    // Ingrédient sans per100g
    const invalidIngredient = {
      food: { id: 'bad', name: 'Sans données', source: 'manual' as const, per100g: null as any },
      quantityG: 100,
    }
    const result = computeRecipeNutrition([validIngredient, invalidIngredient], 1)
    expect(result.kcal).toBe(100)
  })

  it("arrondit les kcal à l'entier le plus proche", () => {
    // 150g à 100kcal/100g = 150 kcal, divisé par 2 portions = 75 kcal (exact)
    const ingredients = [makeIngredient(150)]
    const result = computeRecipeNutrition(ingredients, 2)
    expect(Number.isInteger(result.kcal)).toBe(true)
  })

  it('arrondit les macros à 1 décimale', () => {
    // 100g à 10.35 proteines/100g = 10.35 → arrondi à 10.4
    const ingredients = [
      makeIngredient(100, { kcal: 100, proteines: 10.35, glucides: 20, lipides: 5 }),
    ]
    const result = computeRecipeNutrition(ingredients, 1)
    // 10.35 * 1 → arrondi à 1 décimale
    expect(result.proteines).toBe(10.4)
  })
})
