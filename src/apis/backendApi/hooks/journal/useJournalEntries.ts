import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { JournalEntriesResponseDTO } from '@/src/apis/backendApi/dto/journal/journal.dto'
import { journalEntryDTOtoPlannedMeal } from '@/src/apis/backendApi/mappers/journal/journal.mapper'
import type { PlannedMeal } from '@/src/models/planning/planning.model'

async function fetchJournalEntries(dateKey: string): Promise<PlannedMeal[]> {
  const { data } = await backendClient.get<JournalEntriesResponseDTO>('/api/journal/entries', {
    params: { date: dateKey },
  })
  return data.data.map(journalEntryDTOtoPlannedMeal)
}

export function useJournalEntries(dateKey: string) {
  return useQuery({
    queryKey: ['journal', dateKey],
    queryFn: () => fetchJournalEntries(dateKey),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
