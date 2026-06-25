import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { PlanningRegenerateResponseDTO } from '@/src/apis/backendApi/dto/planning/planning.dto'
import { planningSlotDTOtoSlot } from '@/src/apis/backendApi/mappers/planning/planning.mapper'
import type { MealType, PlannedRecipeSlot } from '@/src/models/planning/planning.model'

const MOCK_RECIPES: Record<
  string,
  readonly {
    id: string
    name: string
    kcal: number
    proteines: number
    glucides: number
    lipides: number
    prepTime?: number
    cookTime?: number
  }[]
> = {
  'Petit-déjeuner': [
    {
      id: 'pb1',
      name: 'Porridge aux fruits rouges',
      kcal: 380,
      proteines: 12,
      glucides: 58,
      lipides: 10,
      prepTime: 5,
      cookTime: 10,
    },
    {
      id: 'pb2',
      name: 'Omelette aux champignons',
      kcal: 320,
      proteines: 22,
      glucides: 8,
      lipides: 20,
      prepTime: 5,
      cookTime: 8,
    },
    {
      id: 'pb4',
      name: 'Pancakes à la banane',
      kcal: 420,
      proteines: 14,
      glucides: 62,
      lipides: 12,
      prepTime: 10,
      cookTime: 15,
    },
  ],
  Déjeuner: [
    {
      id: 'dj1',
      name: 'Bowl de quinoa au poulet grillé',
      kcal: 620,
      proteines: 45,
      glucides: 52,
      lipides: 18,
      prepTime: 15,
      cookTime: 20,
    },
    {
      id: 'dj2',
      name: 'Salade niçoise au thon',
      kcal: 480,
      proteines: 38,
      glucides: 22,
      lipides: 24,
      prepTime: 15,
    },
    {
      id: 'dj4',
      name: 'Pâtes complètes au pesto et légumes',
      kcal: 560,
      proteines: 22,
      glucides: 72,
      lipides: 20,
      prepTime: 5,
      cookTime: 15,
    },
  ],
  Collation: [
    {
      id: 'co1',
      name: 'Yaourt grec aux noix',
      kcal: 220,
      proteines: 14,
      glucides: 12,
      lipides: 12,
      prepTime: 2,
    },
    {
      id: 'co2',
      name: "Pomme et beurre d'amande",
      kcal: 180,
      proteines: 4,
      glucides: 22,
      lipides: 10,
      prepTime: 2,
    },
    {
      id: 'co4',
      name: 'Poignée de noix de cajou',
      kcal: 160,
      proteines: 5,
      glucides: 9,
      lipides: 13,
      prepTime: 1,
    },
  ],
  Dîner: [
    {
      id: 'di1',
      name: 'Saumon vapeur, riz basmati et brocolis',
      kcal: 520,
      proteines: 40,
      glucides: 48,
      lipides: 14,
      prepTime: 10,
      cookTime: 20,
    },
    {
      id: 'di2',
      name: 'Soupe de lentilles corail au curry',
      kcal: 380,
      proteines: 20,
      glucides: 52,
      lipides: 10,
      prepTime: 10,
      cookTime: 25,
    },
    {
      id: 'di4',
      name: 'Gratin de courgettes au fromage',
      kcal: 340,
      proteines: 18,
      glucides: 22,
      lipides: 20,
      prepTime: 15,
      cookTime: 30,
    },
  ],
}

interface RegenerateParams {
  dateKey: string
  mealType: MealType
  prompt?: string
}

async function fetchMockRegenerate(mealType: MealType): Promise<PlannedRecipeSlot> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  const recipes = MOCK_RECIPES[mealType] ?? MOCK_RECIPES['Déjeuner']
  const recipe = recipes[Math.floor(Math.random() * recipes.length)]
  return planningSlotDTOtoSlot({ mealType, recipe })
}

async function fetchRegenerate(params: RegenerateParams): Promise<PlannedRecipeSlot> {
  if (!process.env.EXPO_PUBLIC_API_URL) {
    return fetchMockRegenerate(params.mealType)
  }

  const { data } = await backendClient.post<PlanningRegenerateResponseDTO>(
    `/api/planning/week/${params.dateKey}/meals/${params.mealType}/regenerate`,
    { prompt: params.prompt },
  )

  return planningSlotDTOtoSlot({ mealType: params.mealType, recipe: data.recipe })
}

export function useRegenerateMealSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchRegenerate,
    onSuccess: (newSlot, variables) => {
      queryClient.setQueryData(
        ['planning', 'week', variables.dateKey],
        (prev: PlannedRecipeSlot[] | undefined) => {
          if (!prev) return [newSlot]
          return prev.map((s) => (s.meal === variables.mealType ? newSlot : s))
        },
      )
    },
  })
}
