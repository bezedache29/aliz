import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { WeightHistoryResponseDTO } from '@/src/apis/backendApi/dto/weight/weight.dto'
import { weightDTOtoWeightEntry } from '@/src/apis/backendApi/mappers/weight/weight.mapper'
import type { WeightEntry } from '@/src/models/weight/weight.model'

async function fetchWeightHistory(): Promise<WeightEntry[]> {
  const { data } = await backendClient.get<WeightHistoryResponseDTO>('/api/weight', {
    params: { limit: 90 },
  })
  return data.data.map(weightDTOtoWeightEntry)
}

export function useWeightHistory() {
  return useQuery({
    queryKey: ['weight'],
    queryFn: fetchWeightHistory,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
