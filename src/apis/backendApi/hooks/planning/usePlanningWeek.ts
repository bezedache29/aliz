import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { PlanningWeekResponseDTO } from '@/src/apis/backendApi/dto/planning/planning.dto'
import { planningSlotDTOtoSlot } from '@/src/apis/backendApi/mappers/planning/planning.mapper'
import type { PlannedRecipeSlot } from '@/src/models/planning/planning.model'

async function fetchPlanningWeek(dateKey: string): Promise<PlannedRecipeSlot[]> {
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
