import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { PlanningRegenerateResponseDTO } from '@/src/apis/backendApi/dto/planning/planning.dto'
import { planningSlotDTOtoSlot } from '@/src/apis/backendApi/mappers/planning/planning.mapper'
import type { MealType, PlannedRecipeSlot } from '@/src/models/planning/planning.model'

interface RegenerateParams {
  dateKey: string
  mealType: MealType
  prompt?: string
}

async function fetchRegenerate(params: RegenerateParams): Promise<PlannedRecipeSlot> {
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
