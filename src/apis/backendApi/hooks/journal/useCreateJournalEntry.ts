import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { JournalEntryResponseDTO } from '@/src/apis/backendApi/dto/journal/journal.dto'
import {
  journalEntryDTOtoPlannedMeal,
  plannedMealToCreateDTO,
} from '@/src/apis/backendApi/mappers/journal/journal.mapper'
import type { PlannedMeal } from '@/src/models/planning/planning.model'

interface CreateJournalEntryVariables {
  meal: Omit<PlannedMeal, 'id'>
  dateKey: string
}

async function fetchCreateJournalEntry({
  meal,
  dateKey,
}: CreateJournalEntryVariables): Promise<PlannedMeal> {
  const { data } = await backendClient.post<JournalEntryResponseDTO>(
    '/api/journal/entries',
    plannedMealToCreateDTO(meal, dateKey),
  )
  return journalEntryDTOtoPlannedMeal(data.data)
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchCreateJournalEntry,
    onSuccess: (created, variables) => {
      queryClient.setQueryData<PlannedMeal[]>(['journal', variables.dateKey], (prev) => [
        ...(prev ?? []),
        created,
      ])
    },
  })
}
