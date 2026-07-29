import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { JournalEntryResponseDTO } from '@/src/apis/backendApi/dto/journal/journal.dto'
import { plannedMealToUpdateDTO } from '@/src/apis/backendApi/mappers/journal/journal.mapper'
import type { PlannedMeal } from '@/src/models/planning/planning.model'

interface UpdateJournalEntryVariables {
  meal: PlannedMeal
  dateKey: string
}

async function fetchUpdateJournalEntry({
  meal,
  dateKey,
}: UpdateJournalEntryVariables): Promise<void> {
  await backendClient.put<JournalEntryResponseDTO>(
    `/api/journal/entries/${meal.id}`,
    plannedMealToUpdateDTO(meal, dateKey),
  )
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchUpdateJournalEntry,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<PlannedMeal[]>(['journal', variables.dateKey], (prev) =>
        prev
          ? prev.map((m) => (m.id === variables.meal.id ? variables.meal : m))
          : [variables.meal],
      )
    },
  })
}
