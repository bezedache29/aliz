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
  return planningSlotDTOtoSlot({
    date: params.dateKey,
    mealType: params.mealType,
    courses: data.courses,
  })
}

export function useRegenerateMealSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchRegenerate,
    onSuccess: () => {
      // La lecture se fait par semaine (clé ancrée sur le lundi affiché), pas par jour :
      // on invalide par préfixe plutôt que de recomposer le cache à la main.
      queryClient.invalidateQueries({ queryKey: ['planning', 'week'] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}
