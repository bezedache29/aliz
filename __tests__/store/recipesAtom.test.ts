import { createStore } from 'jotai'

import type { Recipe } from '@/src/models/recipe/recipe.model'
import {
  addRecipe,
  recipesAtom,
  removeRecipe,
  searchRecipes,
  toggleFavorite,
  updateRecipe,
} from '@/src/store/recipesAtom'

// Recette minimale valide pour les tests unitaires
const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'recipe-1',
  name: 'Poulet rôti',
  category: 'Plat principal',
  ingredients: [],
  steps: [],
  isFavorite: false,
  ...overrides,
})

describe('recipesAtom', () => {
  it('initialise avec les recettes mock', () => {
    const store = createStore()
    const recipes = store.get(recipesAtom)
    expect(Array.isArray(recipes)).toBe(true)
    expect(recipes.length).toBeGreaterThan(0)
  })

  it('accepte une mise à jour de la liste', () => {
    const store = createStore()
    const recipe = makeRecipe()
    store.set(recipesAtom, [recipe])
    expect(store.get(recipesAtom)).toHaveLength(1)
    expect(store.get(recipesAtom)[0].id).toBe('recipe-1')
  })
})

describe('addRecipe', () => {
  it('ajoute une recette en tête de liste', () => {
    const existing = makeRecipe({ id: 'recipe-0', name: 'Soupe' })
    const newRecipe = makeRecipe({ id: 'recipe-1', name: 'Poulet rôti' })
    const result = addRecipe([existing], newRecipe)
    expect(result[0].id).toBe('recipe-1')
    expect(result[1].id).toBe('recipe-0')
  })

  it('ajoute dans une liste vide', () => {
    const recipe = makeRecipe()
    const result = addRecipe([], recipe)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('recipe-1')
  })

  it('ne modifie pas le tableau source (immutabilité)', () => {
    const prev = [makeRecipe()]
    const newRecipe = makeRecipe({ id: 'recipe-2' })
    addRecipe(prev, newRecipe)
    expect(prev).toHaveLength(1)
  })
})

describe('removeRecipe', () => {
  it("supprime la recette avec l'id correspondant", () => {
    const r1 = makeRecipe({ id: 'recipe-1' })
    const r2 = makeRecipe({ id: 'recipe-2' })
    const result = removeRecipe([r1, r2], 'recipe-1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('recipe-2')
  })

  it("retourne la liste inchangée si l'id est inconnu", () => {
    const r1 = makeRecipe({ id: 'recipe-1' })
    const result = removeRecipe([r1], 'inexistant')
    expect(result).toHaveLength(1)
  })

  it("retourne un tableau vide si la liste ne contient qu'un seul élément supprimé", () => {
    const r1 = makeRecipe({ id: 'recipe-1' })
    const result = removeRecipe([r1], 'recipe-1')
    expect(result).toHaveLength(0)
  })

  it('ne modifie pas le tableau source (immutabilité)', () => {
    const prev = [makeRecipe({ id: 'recipe-1' })]
    removeRecipe(prev, 'recipe-1')
    expect(prev).toHaveLength(1)
  })
})

describe('toggleFavorite', () => {
  it('passe isFavorite de false à true', () => {
    const recipe = makeRecipe({ id: 'recipe-1', isFavorite: false })
    const result = toggleFavorite([recipe], 'recipe-1')
    expect(result[0].isFavorite).toBe(true)
  })

  it('passe isFavorite de true à false', () => {
    const recipe = makeRecipe({ id: 'recipe-1', isFavorite: true })
    const result = toggleFavorite([recipe], 'recipe-1')
    expect(result[0].isFavorite).toBe(false)
  })

  it('ne modifie pas les autres recettes', () => {
    const r1 = makeRecipe({ id: 'recipe-1', isFavorite: false })
    const r2 = makeRecipe({ id: 'recipe-2', isFavorite: false })
    const result = toggleFavorite([r1, r2], 'recipe-1')
    expect(result[1].isFavorite).toBe(false)
  })

  it("retourne la liste inchangée si l'id est inconnu", () => {
    const recipe = makeRecipe({ id: 'recipe-1', isFavorite: false })
    const result = toggleFavorite([recipe], 'inexistant')
    expect(result[0].isFavorite).toBe(false)
  })

  it('ne modifie pas le tableau source (immutabilité)', () => {
    const prev = [makeRecipe({ id: 'recipe-1', isFavorite: false })]
    toggleFavorite(prev, 'recipe-1')
    expect(prev[0].isFavorite).toBe(false)
  })
})

describe('updateRecipe', () => {
  it('remplace la recette avec le même id', () => {
    const r1 = makeRecipe({ id: 'recipe-1', name: 'Ancien nom' })
    const r2 = makeRecipe({ id: 'recipe-2' })
    const updated = makeRecipe({ id: 'recipe-1', name: 'Nouveau nom' })
    const result = updateRecipe([r1, r2], updated)
    expect(result[0].name).toBe('Nouveau nom')
    expect(result[1].id).toBe('recipe-2')
  })

  it("retourne la liste inchangée si l'id est inconnu", () => {
    const r1 = makeRecipe({ id: 'recipe-1', name: 'Test' })
    const updated = makeRecipe({ id: 'inexistant', name: 'X' })
    const result = updateRecipe([r1], updated)
    expect(result[0].name).toBe('Test')
  })

  it('préserve la position dans la liste', () => {
    const r1 = makeRecipe({ id: 'recipe-1' })
    const r2 = makeRecipe({ id: 'recipe-2', name: 'À modifier' })
    const r3 = makeRecipe({ id: 'recipe-3' })
    const updated = makeRecipe({ id: 'recipe-2', name: 'Modifié' })
    const result = updateRecipe([r1, r2, r3], updated)
    expect(result[1].name).toBe('Modifié')
    expect(result[0].id).toBe('recipe-1')
    expect(result[2].id).toBe('recipe-3')
  })

  it('ne modifie pas le tableau source (immutabilité)', () => {
    const prev = [makeRecipe({ id: 'recipe-1', name: 'Original' })]
    const updated = makeRecipe({ id: 'recipe-1', name: 'Modifié' })
    updateRecipe(prev, updated)
    expect(prev[0].name).toBe('Original')
  })
})

describe('searchRecipes', () => {
  const recipes: Recipe[] = [
    makeRecipe({ id: '1', name: 'Poulet rôti aux légumes' }),
    makeRecipe({ id: '2', name: 'Soupe de tomates' }),
    makeRecipe({ id: '3', name: 'Pâtes carbonara' }),
    makeRecipe({ id: '4', name: 'Yaourt aux fruits' }),
  ]

  it('retourne toutes les recettes si la query est vide', () => {
    expect(searchRecipes(recipes, '')).toHaveLength(4)
  })

  it('retourne toutes les recettes si la query ne contient que des espaces', () => {
    expect(searchRecipes(recipes, '   ')).toHaveLength(4)
  })

  it('filtre par nom — insensible à la casse', () => {
    const result = searchRecipes(recipes, 'poulet')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filtre par nom — insensible aux accents', () => {
    // "pates" doit trouver "Pâtes carbonara"
    const result = searchRecipes(recipes, 'pates')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  it('retourne un tableau vide si aucun résultat', () => {
    expect(searchRecipes(recipes, 'pizza')).toHaveLength(0)
  })

  it('trouve une recette par correspondance partielle', () => {
    const result = searchRecipes(recipes, 'tomat')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })
})
