import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { PlanningWeekResponseDTO } from '@/src/apis/backendApi/dto/planning/planning.dto'
import { planningSlotDTOtoSlot } from '@/src/apis/backendApi/mappers/planning/planning.mapper'
import type { PlannedRecipeSlot } from '@/src/models/planning/planning.model'

type MockRecipe = {
  id: string
  name: string
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  prepTime?: number
  cookTime?: number
}

const MOCK_RECIPES: Record<string, readonly MockRecipe[]> = {
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
      id: 'pb3',
      name: 'Smoothie bowl banane-épinards',
      kcal: 410,
      proteines: 14,
      glucides: 65,
      lipides: 9,
      prepTime: 10,
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
      id: 'dj3',
      name: 'Wok de boeuf aux légumes',
      kcal: 540,
      proteines: 42,
      glucides: 35,
      lipides: 20,
      prepTime: 10,
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
      id: 'co3',
      name: 'Fromage blanc et myrtilles',
      kcal: 160,
      proteines: 12,
      glucides: 18,
      lipides: 4,
      prepTime: 2,
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
      id: 'di3',
      name: 'Poulet rôti aux herbes et légumes',
      kcal: 480,
      proteines: 44,
      glucides: 18,
      lipides: 22,
      prepTime: 15,
      cookTime: 35,
    },
  ],
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function fetchMockPlanningWeek(): Promise<PlannedRecipeSlot[]> {
  await new Promise((resolve) => setTimeout(resolve, 600))

  const meals = (Object.keys(MOCK_RECIPES) as (keyof typeof MOCK_RECIPES)[]).map((mealType) => ({
    mealType,
    recipe: pickRandom(MOCK_RECIPES[mealType]),
  }))

  return meals.map(planningSlotDTOtoSlot)
}

async function fetchPlanningWeek(dateKey: string): Promise<PlannedRecipeSlot[]> {
  if (!process.env.EXPO_PUBLIC_API_URL) {
    return fetchMockPlanningWeek()
  }

  const { data } = await backendClient.get<PlanningWeekResponseDTO>('/api/planning/week', {
    params: { from: dateKey },
  })

  return data.meals.map(planningSlotDTOtoSlot)
}

export function usePlanningWeek(dateKey: string) {
  return useQuery({
    queryKey: ['planning', 'week', dateKey],
    queryFn: () => fetchPlanningWeek(dateKey),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
