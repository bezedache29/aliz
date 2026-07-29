import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { PlannedMeal } from '@/src/models/planning/planning.model'

interface DeleteJournalEntryVariables {
  id: string
  dateKey: string
}

async function fetchDeleteJournalEntry({ id }: DeleteJournalEntryVariables): Promise<void> {
  await backendClient.delete(`/api/journal/entries/${id}`)
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchDeleteJournalEntry,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<PlannedMeal[]>(['journal', variables.dateKey], (prev) =>
        prev ? prev.filter((m) => m.id !== variables.id) : [],
      )
    },
  })
}
